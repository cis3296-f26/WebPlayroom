const KEY_MAP = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down'
}

export function setupKeyboard(element) {
    const keys = {left: false, right: false, up: false, down: false};

    const onKeyDown = (event) => {
        const direction = KEY_MAP[event.key];
        if(direction) {
            keys[direction] = true;
            event.preventDefault();
        }
    }

    const onKeyUp = (event) => {
        const direction = KEY_MAP[event.key];
        if(direction) keys[direction] = false;
    }

    element.addEventListener('keydown', onKeyDown);
    element.addEventListener('keyup', onKeyUp);

    const cleanup = () => {
        element.removeEventListener('keydown', onKeyDown)
        element.removeEventListener('keyup', onKeyUp)
    }

    return { keys, cleanup }
}