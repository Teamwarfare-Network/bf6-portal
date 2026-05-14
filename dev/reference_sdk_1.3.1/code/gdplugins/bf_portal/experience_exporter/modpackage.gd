@tool
extends RefCounted
class_name ModPackage

var name: String = ""
var description: String = ""
var root_path: String = ""
var script_files: Array[String] = []
var strings_files: Array[String] = []
var workspace_files: Array[String] = []
var map_list: Array[String] = []
var is_valid_experience: bool = true
var mod_config: Dictionary = {}

var icon = load("res://addons/bf_portal/experience_exporter/lib/icons/breakthrough.svg")

var _config = PortalPlugin.read_config()

func _init(mod_info_path: String) -> void:
	mod_config = _get_config(mod_info_path)
	root_path = mod_info_path.get_base_dir()
	_set_info()
	_get_level_files()

func _set_info() -> void:
	
	if mod_config:
		if mod_config.has("name"):
			name = mod_config["name"]

		if mod_config.has("description"):
			description = mod_config["description"]

		if mod_config.has("workspace"):
			var workspace: String = mod_config["workspace"]
			if workspace != "":
				workspace_files.append(mod_config["workspace"])
				_validate(workspace_files, false)

		if mod_config.has("script"):
			var script: String = mod_config["script"]
			if script != "":
				script_files.append(mod_config["script"])
				_validate(script_files, false)

		if mod_config.has("strings"):
			var string: String = mod_config["strings"]
			if string != "":
				strings_files.append(mod_config["strings"])
				_validate(strings_files, false)		
	else: 
		print("Mod config file missing")
		is_valid_experience = false
		return
			
	var icon_path = "%s/%s" % [root_path, _config["modIconFile"]]	
	var icon_extensions = _config["modIconFileExtensions"]
	for icon_extension in icon_extensions:
		if FileAccess.file_exists("%s.%s" % [icon_path, icon_extension]):
			icon = load("%s.%s" % [icon_path, icon_extension])
		
func _get_level_files() -> void:	
	var _files = DirAccess.get_files_at(root_path)
	for f in _files: 		
		if f.ends_with(".spatial.json"):
			map_list.append(f)

func _validate(data: Array[String], is_empty_fatal: bool) -> void:
	if data.size() == 0 and is_empty_fatal:
		is_valid_experience = false
		print("Invalidating %s as it doesn't contain anything and this has been marked as a fatal error" % data)
	elif data.size() == 0:
		return
	
	for i in data:
		if not FileAccess.file_exists("%s/%s" % [root_path, i]):
			is_valid_experience = false
			print("Invalidating %s as the file does not exist" % i)
			return
	
func _get_config(_json_path) -> Dictionary:	
	
	if FileAccess.file_exists(_json_path):
		var _mod_json = JSON.parse_string(FileAccess.open(_json_path, FileAccess.READ).get_as_text())
		if not _mod_json:
			print("Unable to read json of %s, invalidating package" % _json_path)
			is_valid_experience = false
			return {}
		var config: Dictionary = _mod_json
		return _mod_json
	else:
		print("Unable to read json of %s" % _json_path)
		is_valid_experience = false
		return {}
