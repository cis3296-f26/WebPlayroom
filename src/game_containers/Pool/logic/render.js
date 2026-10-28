import { BALL_RADIUS } from "../constants";

export function drawBall (x, y, color, ctx) {
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.strokeStyle = 'black';
    ctx.fill();
    ctx.stroke();
}

//export function 