import { BALL_RADIUS, TABLE_WIDTH, TABLE_HEIGHT } from "../constants";

export function drawBall (x, y, color, ctx) {
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.strokeStyle = 'black';
    ctx.fill();
    ctx.stroke();
}

function drawVector(pos, vec, color, ctx, scale = 1) {
    const end = pos.add(vec.multiply(scale))

    ctx.beginPath();
    ctx.moveTo(pos.x , pos.y)
    ctx.lineTo(end.x, end.y)
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

export function drawFrame(ctx, balls) {
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)
    for(const ball of balls) {
        drawBall(ball.pos.x, ball.pos.y, ball.color, ctx);
        drawVector(ball.pos, ball.acc, 'red', ctx, 100)
        drawVector(ball.pos, ball.vel, 'yellow', ctx, 10)
    }
}