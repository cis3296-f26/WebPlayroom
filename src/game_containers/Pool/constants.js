/* Constants */
// Render
export const BALL_RADIUS = 10;
export const BALL_START_X = 100;
export const BALL_START_Y = 100;

export const TABLE_WIDTH = 1000;
export const TABLE_HEIGHT = 500;

export const TABLE_CENTER_Y = TABLE_HEIGHT / 2  // 250
export const RACK_APEX_X = TABLE_WIDTH * 0.75   // the "foot spot," where the 1 ball goes
export const CUE_START_X = TABLE_WIDTH * 0.25 

// Physics
export const BALL_ACCEL = 0.2; // speed added per frame held
export const FRICTION = 0.98; // fraction of speed kept each frame
export const MIN_SPEED = 0.01;
export const RESTITUTION = 0.95; // bounciness of ball hits: 1 = perfect bounce, 0 = no bounce