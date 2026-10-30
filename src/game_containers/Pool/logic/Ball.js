import { BALL_RADIUS } from "../constants";

export default class Ball {
    constructor(x, y, color, number = 0) {
        this.x = x;
        this.y = y;
        this.vx = 0
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.color = color;
        this.number = number;
        this.radius = BALL_RADIUS
    }
}