import { Shotgun } from './Items/Shotgun.js';
import { Player } from './Characters/Player.js';
import { Dealer } from './Characters/Dealer.js';


class BuckshotGame {
    player = new Player();
    dealer = new Dealer();
    turn = 'player';
    round = 0;
    winner = null;

    while() {
        if (this.turn === 'player') { this.playerTurn(this.player); this.turn='dealer'; } 
        else                        { this.dealerTurn(this.dealer); this.turn = 'player'; }

        if (this.winner != null) { return; }
    }

    playerTurn(player) {
        //take in console input for action
        //Need a basic menu of options and command terms as well as faulty command handling.
        //shoot dealer OR myself, view health, view round number, quit game (unload the shotgun on yourself, if no bullets animation bashing shotgun in your own mouth over and over, blood splatter/red vignette vfx)
    }

    dealerTurn(dealer) { }
}
