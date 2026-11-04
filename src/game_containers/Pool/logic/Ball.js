import { BALL_RADIUS } from "../constants";
import { Vector } from "./Vector"

export default class Ball {
    constructor(x, y, color, number = 0, type = 'solid') {
        this.pos = new Vector(x, y);
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
        this.color = color;
        this.number = number;
        this.type = type;
        this.radius = BALL_RADIUS
    }
}