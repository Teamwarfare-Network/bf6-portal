// @ts-nocheck
// Module: foundation/ui-layout -- HUD, dialog, admin, and victory layout constants

// Clock + HUD layout constants (pixels unless noted).
const TOP_HUD_OFFSET_Y = 10;
const CLOCK_POSITION_X = 0;
const CLOCK_POSITION_Y = 53 + TOP_HUD_OFFSET_Y;
const CLOCK_WIDTH = 220;
const CLOCK_HEIGHT = 44;
const ROUND_COUNTER_OFFSET_X = -6;
const ROUND_SLASH_OFFSET_X = -6;
const TOP_HUD_ROOT_WIDTH = 1920;
const TOP_HUD_ROOT_HEIGHT = 260;
const CLOCK_FONT_SIZE = 32;
const LOW_TIME_THRESHOLD_SECONDS = 60; // Low-time color threshold in seconds.

// HUD status colors (vectors are RGB 0..1).
const COLOR_NORMAL = mod.CreateVector(1, 1, 1);
const COLOR_LOW_TIME = mod.CreateVector(1, 131 / 255, 97 / 255);
const COLOR_READY_GREEN = mod.CreateVector(173 / 255, 253 / 255, 134 / 255); // #ADFD86

// Status / emphasis colors (use constants; do not inline CreateVector() in UI code).
const COLOR_NOT_READY_RED = mod.CreateVector(1, 0, 0);
const COLOR_WARNING_YELLOW = mod.CreateVector(1, 1, 0);

// Buttons look and feel (base / selected / pressed / border).
const COLOR_BUTTON_BASE = COLOR_GRAY;
const BUTTON_OPACITY_BASE = 0.75;
const COLOR_BUTTON_SELECTED = COLOR_BLUE;
const BUTTON_OPACITY_SELECTED = 0.75;
const COLOR_BUTTON_PRESSED = COLOR_WHITE;
const BUTTON_OPACITY_PRESSED = 0.75;
const COLOR_BUTTON_BORDER = COLOR_GRAY;
const BUTTON_BORDER_OPACITY = 0.50;
const BUTTON_BORDER_PADDING = 0;

// Ready Dialog
const READY_DIALOG_SMALL_BUTTON_WIDTH = 26;
const READY_DIALOG_SMALL_BUTTON_HEIGHT = 24;
const READY_DIALOG_MAIN_BUTTON_WIDTH = 300;
const READY_DIALOG_MAIN_BUTTON_HEIGHT = 45;
// Ready button horizontal offset relative to dialog center.
const READY_DIALOG_READY_BUTTON_OFFSET_X = -(Math.floor(READY_DIALOG_MAIN_BUTTON_WIDTH / 2) + 10);
const READY_DIALOG_CONFIRM_BUTTON_GAP = 8;
const READY_DIALOG_CONFIRM_BUTTON_WIDTH = READY_DIALOG_MAIN_BUTTON_WIDTH - 40;
const READY_DIALOG_RESET_BUTTON_WIDTH = Math.floor((READY_DIALOG_MAIN_BUTTON_WIDTH - 40) / 2);
const READY_DIALOG_RESET_BUTTON_OFFSET_X = 0;
const READY_PANEL_T1_BG_COLOR = mod.CreateVector(0.10, 0.25, 0.70);
const READY_PANEL_T2_BG_COLOR = mod.CreateVector(0.70, 0.15, 0.15);
const READY_PANEL_BG_ALPHA = 0.20;
const READY_DIALOG_BUTTON_TEXT_COLOR_RGB: [number, number, number] = [1, 1, 1];
const READY_DIALOG_LABEL_TEXT_COLOR = COLOR_WHITE;
const READY_DIALOG_BORDER_COLOR = COLOR_GRAY;

// Admin Panel
const ADMIN_PANEL_HEIGHT = 250;
const ADMIN_PANEL_PADDING = 5;
const ADMIN_PANEL_BASE_X = -5;
const ADMIN_PANEL_BASE_Y = 15;
const ADMIN_PANEL_OFFSET_X = 10;
const ADMIN_PANEL_OFFSET_Y = 15;
const ADMIN_PANEL_TOGGLE_OFFSET_X = 10;
const ADMIN_PANEL_TOGGLE_OFFSET_Y = 15;
const ADMIN_PANEL_TOGGLE_WIDTH = 120;
const ADMIN_PANEL_TOGGLE_HEIGHT = 24;
const ADMIN_PANEL_BUTTON_SIZE_X = 48;
const ADMIN_PANEL_BUTTON_SIZE_Y = 30;
const ADMIN_PANEL_LABEL_SIZE_X = 130;
const ADMIN_PANEL_CONTENT_WIDTH = (ADMIN_PANEL_BUTTON_SIZE_X * 2) + ADMIN_PANEL_LABEL_SIZE_X + 16;
const ADMIN_PANEL_ROW_SPACING_Y = 4;
const ADMIN_PANEL_BG_COLOR = COLOR_DARK_BLACK;
const ADMIN_PANEL_BG_ALPHA = 1.0;
const ADMIN_PANEL_BG_FILL = mod.UIBgFill.Blur;
const ADMIN_PANEL_LABEL_TEXT_COLOR_RGB: [number, number, number] = [1, 1, 1];
const ADMIN_PANEL_BUTTON_TEXT_COLOR = COLOR_WHITE;
const ADMIN_PANEL_LABEL_TEXT_COLOR = COLOR_WHITE;

// Victory dialog theme colors (ParseUI expects RGB tuples, not vectors).
const VICTORY_BG_RGB: [number, number, number] = [0.0314, 0.0431, 0.0431];
const VICTORY_TEAM1_BG_RGB: [number, number, number] = [0.1098, 0.2304, 0.25];
const VICTORY_TEAM2_BG_RGB: [number, number, number] = [0.25, 0.1284, 0.0951];
const VICTORY_TEAM1_TEXT_RGB: [number, number, number] = [0.4392, 0.9216, 1];
const VICTORY_TEAM2_TEXT_RGB: [number, number, number] = [1, 0.5137, 0.3804];
const VICTORY_DIALOG_WIDTH = 360;
const VICTORY_DIALOG_HEIGHT = 500;
const VICTORY_DIALOG_ROSTER_ROW_Y = 282;
const VICTORY_DIALOG_ROSTER_ROW_WIDTH = 340;
const VICTORY_DIALOG_ROSTER_ROW_HEIGHT_MAX = 200;
const VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH = 160;
const VICTORY_DIALOG_ROSTER_ROW_HEIGHT = 12;
const VICTORY_DIALOG_ROSTER_ROW_PADDING_TOP = 4;
const VICTORY_DIALOG_ROSTER_ROW_PADDING_BOTTOM = 4;
const VICTORY_DIALOG_BOTTOM_PADDING = 18;
