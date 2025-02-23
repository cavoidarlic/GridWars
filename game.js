class TicTacGoes {
    constructor() {
        this.board = Array(9).fill(null);
        this.currentPlayer = Math.random() < 0.5 ? 'black' : 'white';
        this.phase = 'placing';
        this.pieceCount = { black: 0, white: 0 };
        this.selectedCell = null;
        this.init();
    }

    init() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleClick(cell));
        });
        this.updateStatus();
    }

    handleClick(cell) {
        const index = parseInt(cell.dataset.index);

        if (this.phase === 'placing') {
            if (this.board[index]) return;
            this.placePiece(index);
        } else {
            if (this.selectedCell === null) {
                if (this.board[index] !== this.currentPlayer) return;
                this.selectPiece(cell, index);
            } else {
                if (!this.isValidMove(this.selectedCell, index)) return;
                this.movePiece(index);
            }
        }
    }

    placePiece(index) {
        this.board[index] = this.currentPlayer;
        document.querySelector(`[data-index="${index}"]`).classList.add(this.currentPlayer);
        this.pieceCount[this.currentPlayer]++;

        if (this.checkWin()) {
            this.endGame();
            return;
        }

        if (this.pieceCount.black === 3 && this.pieceCount.white === 3) {
            this.phase = 'moving';
        }

        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updateStatus();
    }

    selectPiece(cell, index) {
        this.selectedCell = index;
        cell.classList.add('selected');
    }

    movePiece(newIndex) {
        const oldCell = document.querySelector(`[data-index="${this.selectedCell}"]`);
        const newCell = document.querySelector(`[data-index="${newIndex}"]`);

        oldCell.classList.remove(this.currentPlayer, 'selected');
        newCell.classList.add(this.currentPlayer);

        this.board[newIndex] = this.currentPlayer;
        this.board[this.selectedCell] = null;
        this.selectedCell = null;

        if (this.checkWin()) {
            this.endGame();
            return;
        }

        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updateStatus();
    }

    isValidMove(from, to) {
        if (this.board[to]) return false;
        
        const fromRow = Math.floor(from / 3);
        const fromCol = from % 3;
        const toRow = Math.floor(to / 3);
        const toCol = to % 3;

        return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
    }

    checkWin() {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        return lines.some(line => {
            const [a, b, c] = line;
            return this.board[a] &&
                   this.board[a] === this.board[b] &&
                   this.board[a] === this.board[c];
        });
    }

    updateStatus() {
        const status = document.getElementById('status');
        status.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
    }

    endGame() {
        const status = document.getElementById('status');
        status.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} Wins!`;
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.cursor = 'not-allowed';
            cell.replaceWith(cell.cloneNode(true));
        });
    }
}

new TicTacGoes();
