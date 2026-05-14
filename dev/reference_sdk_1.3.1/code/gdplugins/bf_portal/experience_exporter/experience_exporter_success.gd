@tool
extends Window

@onready var export_workspace_label: Label = %Label_WorkspaceFileUri
@onready var export_script_label: Label = %Label_ScriptFileUri
@onready var export_strings_label: Label = %Label_StringsFileUri
@onready var modify_button: Button = %Button_ModifyExported
@onready var export_level_itemlist: ItemList = %ItemList_LevelFileUris
var _config = PortalPlugin.read_config()

func about_to_popup() -> void:
	if ExperienceExporter.last_export_data.map_list.size() == 0:
		modify_button.disabled = true	
	for i in ExperienceExporter.last_export_data.workspace_files:
		_set_label(export_workspace_label, i.get_file())
	for i in ExperienceExporter.last_export_data.script_files:
		_set_label(export_script_label, i.get_file())
	for i in ExperienceExporter.last_export_data.strings_files:
		_set_label(export_strings_label, i.get_file())
		
	if ExperienceExporter.last_export_data.map_list.size() > 0:
		for i in range(ExperienceExporter.last_export_data.map_list.size()):
			export_level_itemlist.add_item(ExperienceExporter.last_export_data.map_list[i].get_file())
			export_level_itemlist.set_item_disabled(i, true)
	
func _set_label(label: Label, text: String) -> void:
		label.text = text
		
func _open_builder_tool() -> void:
	var portal_url = _config["portalUrl"]
	if portal_url:
		OS.shell_open(portal_url)

func _view_files() -> void:
	var _destination_folder = ExperienceExporter.last_export_data.path_destination
	if DirAccess.dir_exists_absolute(_destination_folder):
		OS.shell_show_in_file_manager(ExperienceExporter.last_export_data.path_destination)
	
func _select_files() -> void: 
	var editor_file_dialog = EditorFileDialog.new()
	editor_file_dialog.current_dir = ExperienceExporter.last_export_data.path_source
	editor_file_dialog.add_filter("*.tscn", "Godot Text Scene")
	editor_file_dialog.file_mode = EditorFileDialog.FILE_MODE_OPEN_FILE
	editor_file_dialog.popup_exclusive_on_parent(self, self.get_visible_rect())
	editor_file_dialog.file_selected.connect(_open_files)

# just allow opening one file at a time, bulk opening is going to freeze most peoples machines
func _open_files(level: String) -> void:
	if FileAccess.file_exists(level):
		EditorInterface.open_scene_from_path(level)
		
func _exit() -> void: 
	self.hide()
