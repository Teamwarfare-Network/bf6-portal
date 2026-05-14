@tool
extends Window

var _config: Dictionary = {}
var _mod_info: String = ""
var _mod_base_dir: String = ""
var _mod_export_dir: String = ""
var _mod_dirs: PackedStringArray = []
var _mod_packages: Array[ModPackage] = []
var _mod_package_selected: ModPackage
var _dir = DirAccess.open("res://")

var portal_dock:
	get:
		return portal_dock
	set(value):
		portal_dock = value
		_process_mods()
		
@onready var itemlist_scripted_modes: ItemList = %ItemList_ScriptedModes
@onready var itemlist_levels: ItemList = %ItemList_Levels 
@onready var label_description: Label = %Label_Description
@onready var checkbutton_selectall: CheckButton = %CheckButton_SelectAll

var _window_success = preload("res://addons/bf_portal/experience_exporter/experience_exporter_success.tscn")
	
func _process_mods() -> void:
	if (not _readconfig()):
		printerr("Failed to read config")
		return
	
	if not _config["mods"] or not DirAccess.dir_exists_absolute(_config["mods"]):
		return
	_mod_info = _config["modInfoFile"]
	_mod_base_dir = _config["mods"]
	_mod_export_dir = _config["modExportDir"]
	
	_mod_dirs = DirAccess.get_directories_at(_mod_base_dir)
	if _mod_dirs.size() == 0: 
		printerr("no mods found in directory")
		return
	else:		
		for _mod in _mod_dirs:
			var _mod_info_full_path = "%s/%s/%s" % [_mod_base_dir, _mod, _mod_info]
			if FileAccess.file_exists(_mod_info_full_path):
				_mod_packages.append(ModPackage.new(_mod_info_full_path))
				
	_mod_packages = _mod_packages.filter(func(package): return package.is_valid_experience)	
	portal_dock.set_exporter_label(_mod_packages.size())
	
func _setup_ui() -> void: 
	itemlist_scripted_modes.clear()
	for i in range(_mod_packages.size()):
		itemlist_scripted_modes.add_item(_mod_packages[i].name,_mod_packages[i].icon)
		itemlist_scripted_modes.set_item_metadata(i, _mod_packages[i])

	
func _scriptedmode_select(selectedIndex: int, clickPosition: Vector2, buttonIndex: int) -> void:
	
	_clear_ui()
	_mod_package_selected = itemlist_scripted_modes.get_item_metadata(selectedIndex)
	
	if _mod_package_selected.map_list:
		var map_list = _mod_package_selected.map_list
		for i in range(map_list.size()):
			itemlist_levels.add_item(map_list[i].replace(".spatial.json",""))
			itemlist_levels.set_item_metadata(i, map_list[i])
	
	if _mod_package_selected.description:
		label_description.text = _mod_package_selected.description
			
func _clear_ui() -> void:
	itemlist_levels.clear()
	checkbutton_selectall.button_pressed = false

func _toggle_select_all(select_all: bool) -> void:
	if itemlist_levels.item_count > 0:
		if select_all:
			for i in range(itemlist_levels.item_count):
				itemlist_levels.select(i, false)
		else:
			itemlist_levels.deselect_all()

func _create_mode() -> void:
	if not _mod_package_selected:
		return
		
	var selected_level_indices = itemlist_levels.get_selected_items()
	var selected_levels: Array[String] = []
	
	for index in selected_level_indices:
		selected_levels.append(itemlist_levels.get_item_metadata(index))
	
	_export_experience(_mod_package_selected, selected_levels)
		
func _readconfig() -> bool:
	
	_config = PortalPlugin.read_config()
	
	if _config.size() == 0:
		return false
	else:
		return true

func _export_experience(_experience: ModPackage, _selected_levels: Array[String]) -> void:
		
	if not _mod_export_dir:
			printerr("modExportDir not defined in config")
			return
	else:
		if not _dir.dir_exists(_mod_export_dir):
			_dir.make_dir(_mod_export_dir)
	
	var regex = RegEx.new()
	regex.compile("[^A-Za-z0-9_.-]")
	
	var experience_name = regex.sub(_experience.name, "", true).to_lower()
	var experience_time = regex.sub(Time.get_datetime_string_from_system(false, false),"",true).to_lower()
	
	var exported_experience_path = "%s/%s-%s" % [_mod_export_dir, experience_name, experience_time]
	var levels_target_path = "%s/%s-%s" % [exported_experience_path, experience_name, "levels"]
	var code_target_path = "%s/%s-%s" % [exported_experience_path, experience_name, "logic"]
	
	_dir.make_dir_recursive(levels_target_path)
	_dir.make_dir_recursive(code_target_path)
	
	# at the moment I keep a static class inside the base sub-plugin, there's likely a better way to do this
	if ExperienceExporter:
		ExperienceExporter.last_export_data = ModExportInfo.new()
		ExperienceExporter.last_export_data.path_source = _experience.root_path
		ExperienceExporter.last_export_data.path_destination = exported_experience_path
		ExperienceExporter.last_export_data.map_list = _copy_files(_experience.root_path, levels_target_path, _selected_levels)
		ExperienceExporter.last_export_data.script_files = _copy_files(_experience.root_path, code_target_path, _experience.script_files)
		ExperienceExporter.last_export_data.workspace_files = _copy_files(_experience.root_path, exported_experience_path, _experience.workspace_files)
		ExperienceExporter.last_export_data.strings_files = _copy_files(_experience.root_path, code_target_path, _experience.strings_files)
		_export_success_window()
	else:
		return
	
func _export_success_window() -> void:
	var window_success: Window = _window_success.instantiate()
	add_child(window_success)
	window_success.popup()

func _copy_files(source: String, target: String, filenames: Array[String]) -> Array[String]:
	var files_copied: Array[String] = []	
	for f in filenames:
		var source_file = "%s/%s" % [source, f]
		var target_file = "%s/%s" % [target, f]
		if  not FileAccess.file_exists(source_file):
			printerr("%s does not exist!")
		
		if _dir.copy(source_file, target_file) == OK:
			files_copied.append(target_file)
		else:
			printerr("file copying error, source: %s, target: %s" % source_file, target_file)
			
	return files_copied
	
func _exit() -> void:
	self.hide()
	self.queue_free()
