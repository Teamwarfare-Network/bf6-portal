@tool
extends RefCounted
class_name ModExportInfo

var path_source: String = ""
var path_destination: String = ""

var script_files: Array[String] = []
var strings_files: Array[String] = []
var workspace_files: Array[String] = []
var map_list: Array[String] = []

func _init() -> void:
	script_files = []
	strings_files = []
	workspace_files = []
	map_list = []
