import { BALL_RADIUS, TABLE_WIDTH, TABLE_HEIGHT } from "../constants";

export function drawBall (x, y, color, ctx) {
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.strokeStyle = 'black';
    ctx.fill();
    ctx.stroke();
}

export function drawFrame(ctx, balls) {
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)
    for(const ball of balls) 
        drawBall(ball.x, ball.y, ball.color, ctx);
}