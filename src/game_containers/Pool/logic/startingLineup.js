import Ball from './Ball'
import { BALL_RADIUS, RACK_APEX_X, CUE_START_X, TABLE_CENTER_Y } from '../constants';

const BALL_COLORS = [
    'yellow','blue','red','purple','orange','green','maroon', // solids
    'black',                                                  // 8 ball
    'yellow','blue','red','purple','orange','green','maroon'  // striped
]

const RACK = [
    [1],
    [9,2],
    [10,8,3],
    [4,11,5,12],
    [6,13,14,7,15],
]

function getType(number) {
    if(number === 8) return 'eight';
    return number < 8 ? 'solid' : 'stripe'
}

export function createStartingLineup () {
    const spacing = BALL_RADIUS * 2 + 0.5;
    const rowGap = spacing * Math.sqrt(3) / 2;

    const balls = [new Ball(CUE_START_X, TABLE_CENTER_Y, 'white', 0, 'cue')]

    RACK.forEach((row, rowIndex) => {
            row.forEach((number, i) => {
            const x = RACK_APEX_X + rowIndex * rowGap;
            const y = TABLE_CENTER_Y + (i - rowIndex / 2) * spacing
            balls.push(new Ball(x, y, BALL_COLORS[number - 1], number, getType(number)))
        });
    })
    
    return balls
}