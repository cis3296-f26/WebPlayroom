import {
    BALL_RADIUS,
    TABLE_WIDTH,
    TABLE_HEIGHT,
    CUE_LENGTH,
    CUE_GAP,
    MAX_PULL_DISTANCE,
    DEBUG_VECTORS,
    POCKETS,
    POCKET_RADIUS
} from "../constants";

// Draws one ball: solids are filled with their color, stripes are white with a colored
// band through the middle, and every ball except the cue ball gets its number.
export function drawBall (ctx, ball) {
    const { x, y } = ball.pos;
    const r = BALL_RADIUS;

    ctx.save();

    // Base circle: stripes start white, everything else starts in its own color
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = ball.type === 'stripe' ? 'white' : ball.color;
    ctx.fill();

    if (ball.type === 'stripe') {
        // clip() limits drawing to the ball's circle, so the band's square ends are cut
        // off at the ball's edge instead of sticking out
        ctx.clip();
        ctx.fillStyle = ball.color;
        ctx.fillRect(x - r, y - r * 0.55, r * 2, r * 1.1);
    }

    if (ball.type !== 'cue') {
        // Small white circle with the number, like a real ball
        ctx.beginPath();
        ctx.arc(x, y, r * 0.55, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.font = `bold ${ball.number >= 10 ? 7 : 8}px sans-serif`; // two digits need a smaller font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(ball.number), x, y + 0.5);
    }

    ctx.restore(); // removes the clip so the outline and later drawings aren't cut off

    ctx.beginPath(); // outline
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
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

// Black holes at the corners and middle of the long sides
function drawPockets (ctx) {
    ctx.save();
    ctx.fillStyle = '#111';
    for (const pocket of POCKETS) {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.restore();
}

// showCue is true only when every ball has stopped, so the cue hides during a shot
export function drawFrame(ctx, balls, cueBall, cue, showCue) {
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)

    drawPockets(ctx);
    if (showCue) drawAimLine(ctx, cueBall, cue);

    for(const ball of balls) {
        if (ball.pocketed) continue; // out of play, so don't draw it on the table
        drawBall(ctx, ball);
        if (DEBUG_VECTORS) drawVector(ball.pos, ball.vel, 'yellow', ctx, 10)
    }

    if (showCue) {
        drawCueStick(ctx, cueBall, cue);
        drawPowerBar(ctx, cue);
    }
}
