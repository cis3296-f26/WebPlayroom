import {
    BALL_RADIUS,
    TABLE_WIDTH,
    TABLE_HEIGHT,
    CUE_LENGTH,
    CUE_GAP,
    MAX_PULL_DISTANCE,
    DEBUG_VECTORS
} from "../constants";

export function drawBall (x, y, color, ctx) {
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
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

// How far a ball can travel along `direction` before its edge reaches a wall
function distanceToWall (pos, direction, radius) {
    const tx = direction.x > 0 ? (TABLE_WIDTH - radius - pos.x) / direction.x
             : direction.x < 0 ? (radius - pos.x) / direction.x
             : Infinity;
    const ty = direction.y > 0 ? (TABLE_HEIGHT - radius - pos.y) / direction.y
             : direction.y < 0 ? (radius - pos.y) / direction.y
             : Infinity;
    return Math.min(tx, ty);
}

// Dashed guide line from the cue ball to the wall it's aimed at
function drawAimLine (ctx, cueBall, cue) {
    const start = cueBall.pos.add(cue.direction.multiply(cueBall.radius));
    const length = Math.max(distanceToWall(cueBall.pos, cue.direction, cueBall.radius) - cueBall.radius, 0);
    const end = start.add(cue.direction.multiply(length));

    ctx.save(); // save/restore keeps the dash setting from leaking into other drawings
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.restore();
}

// The stick sits behind the cue ball, pointing along the aim, and slides back as you pull
function drawCueStick (ctx, cueBall, cue) {
    const back = cue.direction.multiply(-1);
    const tip = cueBall.pos.add(back.multiply(cueBall.radius + CUE_GAP + cue.pull));
    const tipEnd = tip.add(back.multiply(8));
    const butt = tip.add(back.multiply(CUE_LENGTH));

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;

    ctx.beginPath(); // wooden shaft
    ctx.moveTo(tipEnd.x, tipEnd.y);
    ctx.lineTo(butt.x, butt.y);
    ctx.strokeStyle = '#c8a165';
    ctx.stroke();

    ctx.beginPath(); // chalked tip
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tipEnd.x, tipEnd.y);
    ctx.strokeStyle = '#4f86c6';
    ctx.stroke();
    ctx.restore();
}

// Shows shot strength while the player is dragging back
function drawPowerBar (ctx, cue) {
    if (!cue.dragging) return;

    const power = cue.pull / MAX_PULL_DISTANCE; // 0 to 1
    const x = 20, y = TABLE_HEIGHT - 32, width = 150, height = 12;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = power < 0.5 ? '#4caf50' : power < 0.8 ? '#ffc107' : '#f44336';
    ctx.fillRect(x, y, width * power, height);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
}

// showCue is true only when every ball has stopped, so the cue hides during a shot
export function drawFrame(ctx, balls, cueBall, cue, showCue) {
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)

    if (showCue) drawAimLine(ctx, cueBall, cue);

    for(const ball of balls) {
        drawBall(ball.pos.x, ball.pos.y, ball.color, ctx);
        if (DEBUG_VECTORS) drawVector(ball.pos, ball.vel, 'yellow', ctx, 10)
    }

    if (showCue) {
        drawCueStick(ctx, cueBall, cue);
        drawPowerBar(ctx, cue);
    }
}
