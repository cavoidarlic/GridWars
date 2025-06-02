class GridWars {
    constructor() {
        this.boardSize = 3;
        this.maxPieces = 3;
        this.board = Array(this.boardSize * this.boardSize).fill(null);
        this.currentPlayer = 'black';
        this.phase = 'placing';
        this.pieceCount = { black: 0, white: 0 };
        this.selectedCell = null;
        this.gameMode = null;
        this.aiPlayer = 'white';
        this.humanPlayer = 'black';
        this.gameActive = false;
        this.clickSound = new Audio('pop.mp3');
        this.clickSound.volume = 0.3;
        this.moveTimer = null;
        this.timeLeft = 30;
        this.maxMoveTime = 30;
        this.moveHistory = { black: [], white: [] };
        this.stallingWarnings = { black: 0, white: 0 };
        this.maxStallingWarnings = 2;
        this.init();
    }

    init() {
        this.setupMenu();
        this.setupGame();
    }

    setupMenu() {
        document.getElementById('multiplayer-btn').addEventListener('click', () => this.startGame('multiplayer'));
        document.getElementById('ai-easy-btn').addEventListener('click', () => this.startGame('ai-easy'));
        document.getElementById('ai-medium-btn').addEventListener('click', () => this.startGame('ai-medium'));
        document.getElementById('ai-hard-btn').addEventListener('click', () => this.startGame('ai-hard'));
        document.getElementById('restart-btn').addEventListener('click', () => this.showMenu());
        
        document.getElementById('size-3x3').addEventListener('click', () => this.setBoardSize(3));
        document.getElementById('size-4x4').addEventListener('click', () => this.setBoardSize(4));
        document.getElementById('size-5x5').addEventListener('click', () => this.setBoardSize(5));
    }

    setBoardSize(size) {
        this.boardSize = size;
        this.maxPieces = size === 3 ? 3 : (size === 4 ? 4 : 5);
        
        document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`size-${size}x${size}`).classList.add('active');
        
        this.createBoard();
    }

    createBoard() {
        const boardElement = document.getElementById('board');
        const boardContainer = boardElement.closest('.board-container');
        const coordinatesTop = document.getElementById('coordinates-top');
        const coordinatesLeft = document.getElementById('coordinates-left');
        
        // Clear existing content
        boardElement.innerHTML = '';
        coordinatesTop.innerHTML = '';
        coordinatesLeft.innerHTML = '';
        
        // Set board container class for sizing
        boardContainer.className = `board-container size-${this.boardSize}x${this.boardSize}`;
        boardElement.className = `board board-${this.boardSize}x${this.boardSize}`;
        
        // Create column coordinates (A, B, C, etc.)
        for (let col = 0; col < this.boardSize; col++) {
            const coord = document.createElement('div');
            coord.className = 'coord';
            coord.textContent = String.fromCharCode(65 + col); // A, B, C, D, E
            coordinatesTop.appendChild(coord);
        }
        
        // Create row coordinates (1, 2, 3, etc.)
        for (let row = 0; row < this.boardSize; row++) {
            const coord = document.createElement('div');
            coord.className = 'coord';
            coord.textContent = (row + 1).toString();
            coordinatesLeft.appendChild(coord);
        }
        
        // Create board cells
        const totalCells = this.boardSize * this.boardSize;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            
            // Add coordinate as title for accessibility
            const row = Math.floor(i / this.boardSize);
            const col = i % this.boardSize;
            const coordinate = String.fromCharCode(65 + col) + (row + 1);
            cell.title = coordinate;
            
            cell.addEventListener('click', () => this.handleClick(cell));
            boardElement.appendChild(cell);
        }
        
        this.board = Array(totalCells).fill(null);
    }

    setupGame() {
        this.createBoard();
    }

    startGame(mode) {
        this.gameMode = mode;
        this.gameActive = true;
        this.currentPlayer = Math.random() < 0.5 ? 'black' : 'white';
        this.resetBoard();
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('game').classList.remove('hidden');
        this.updateStatus();
        this.startMoveTimer();
        
        if (this.gameMode !== 'multiplayer' && this.currentPlayer === this.aiPlayer) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    showMenu() {
        this.gameActive = false;
        this.stopMoveTimer();
        document.getElementById('game').classList.add('hidden');
        document.getElementById('menu').classList.remove('hidden');
        this.resetBoard();
    }

    resetBoard() {
        this.board = Array(this.boardSize * this.boardSize).fill(null);
        this.phase = 'placing';
        this.pieceCount = { black: 0, white: 0 };
        this.selectedCell = null;
        this.moveHistory = { black: [], white: [] };
        this.stallingWarnings = { black: 0, white: 0 };
        this.hideStallingWarning();
        this.stopMoveTimer();
        
        document.querySelectorAll('.cell').forEach(cell => {
            cell.className = 'cell';
            cell.style.cursor = 'pointer';
        });
    }

    showStallingWarning(isFirst) {
        const warningElement = document.getElementById('stalling-warning');
        const warningText = document.getElementById('warning-text');
        
        if (isFirst) {
            warningText.textContent = '⚠️ Stop repeating moves! This is a warning!';
            warningElement.classList.remove('final');
        } else {
            warningText.textContent = '🚨 Final warning! Next repeated move = forfeit turn!';
            warningElement.classList.add('final');
        }
        
        warningElement.classList.remove('hidden');
        
        setTimeout(() => {
            this.hideStallingWarning();
        }, 3000);
    }

    hideStallingWarning() {
        document.getElementById('stalling-warning').classList.add('hidden');
    }

    recordMove(from, to) {
        const moveKey = `${from}-${to}`;
        const history = this.moveHistory[this.currentPlayer];
        
        // Only record moves in moving phase
        if (this.phase === 'moving') {
            history.push(moveKey);
            
            // Keep only last 6 moves for pattern detection
            if (history.length > 6) {
                history.shift();
            }
        }
    }

    isRepetitiveMove(from, to) {
        if (this.phase !== 'moving') return false;
        
        const moveKey = `${from}-${to}`;
        const history = this.moveHistory[this.currentPlayer];
        
        // Need at least 2 moves to detect repetition
        if (history.length < 2) return false;
        
        // Check if this move creates a back-and-forth pattern
        const lastMove = history[history.length - 1];
        const reverseMove = `${to}-${from}`;
        
        // Direct back-and-forth
        if (lastMove === reverseMove) return true;
        
        // Check for alternating pattern (A-B, B-A, A-B)
        if (history.length >= 3) {
            const secondLastMove = history[history.length - 2];
            if (moveKey === secondLastMove && lastMove === reverseMove) {
                return true;
            }
        }
        
        // Check for frequent repetition of same move
        const recentMoves = history.slice(-4);
        const moveCount = recentMoves.filter(move => move === moveKey).length;
        
        return moveCount >= 2;
    }

    handleRepetitiveMove() {
        this.stallingWarnings[this.currentPlayer]++;
        
        if (this.stallingWarnings[this.currentPlayer] === 1) {
            this.showStallingWarning(true);
            return false; // Allow the move but warn
        } else if (this.stallingWarnings[this.currentPlayer] === 2) {
            this.showStallingWarning(false);
            return false; // Final warning
        } else {
            // Forfeit turn
            this.hideStallingWarning();
            this.switchPlayer();
            return true; // Move blocked, turn forfeited
        }
    }

    startMoveTimer() {
        this.stopMoveTimer();
        this.timeLeft = this.maxMoveTime;
        this.updateTimerDisplay();
        
        this.moveTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.handleTimeOut();
            }
        }, 1000);
    }

    stopMoveTimer() {
        if (this.moveTimer) {
            clearInterval(this.moveTimer);
            this.moveTimer = null;
        }
    }

    updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        timerElement.textContent = this.timeLeft;
        
        // Remove previous warning classes
        timerElement.classList.remove('warning', 'critical');
        
        // Add warning classes based on time left
        if (this.timeLeft <= 5) {
            timerElement.classList.add('critical');
        } else if (this.timeLeft <= 10) {
            timerElement.classList.add('warning');
        }
    }

    handleTimeOut() {
        if (!this.gameActive) return;
        
        this.stopMoveTimer();
        
        // Force a random move for the current player
        const availableMoves = this.getAvailableMoves();
        if (availableMoves.length > 0) {
            const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            
            this.playClickSound();
            if (this.phase === 'placing') {
                this.placePiece(randomMove.to);
            } else {
                this.selectedCell = randomMove.from;
                this.movePiece(randomMove.to);
            }
        }
    }

    playClickSound() {
        try {
            this.clickSound.currentTime = 0;
            this.clickSound.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
            console.log('Audio not available:', e);
        }
    }

    handleClick(cell) {
        if (!this.gameActive) return;
        
        this.playClickSound();
        
        const index = parseInt(cell.dataset.index);

        if (this.phase === 'placing') {
            if (this.board[index]) return;
            this.placePiece(index);
        } else {
            if (this.selectedCell === null) {
                if (this.board[index] !== this.currentPlayer) return;
                this.selectPiece(cell, index);
            } else {
                if (index === this.selectedCell) {
                    this.deselectPiece();
                    return;
                }
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

        if (this.pieceCount.black === this.maxPieces && this.pieceCount.white === this.maxPieces) {
            this.phase = 'moving';
        }

        this.switchPlayer();
    }

    selectPiece(cell, index) {
        this.deselectPiece();
        this.selectedCell = index;
        cell.classList.add('selected');
    }

    deselectPiece() {
        if (this.selectedCell !== null) {
            document.querySelector(`[data-index="${this.selectedCell}"]`).classList.remove('selected');
            this.selectedCell = null;
        }
    }

    movePiece(newIndex) {
        const from = this.selectedCell;
        const to = newIndex;
        
        // Check for repetitive moves
        if (this.isRepetitiveMove(from, to)) {
            if (this.handleRepetitiveMove()) {
                // Turn was forfeited, deselect piece
                this.deselectPiece();
                return;
            }
        }
        
        // Record the move
        this.recordMove(from, to);
        
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

        this.switchPlayer();
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updateStatus();
        this.startMoveTimer();
        
        if (this.gameMode !== 'multiplayer' && this.currentPlayer === this.aiPlayer && this.gameActive) {
            // Give AI a shorter time limit to prevent long thinking
            this.timeLeft = Math.min(this.timeLeft, 10);
            this.updateTimerDisplay();
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    makeAIMove() {
        if (!this.gameActive) return;
        
        // Limit AI thinking time based on difficulty
        const thinkingTime = {
            'ai-easy': 1000,
            'ai-medium': 2000,
            'ai-hard': 3000
        };
        
        const maxThinkTime = thinkingTime[this.gameMode] || 1000;
        const startTime = Date.now();
        
        let move;
        switch (this.gameMode) {
            case 'ai-easy':
                move = this.getRandomMove();
                break;
            case 'ai-medium':
                move = this.getMediumAIMove();
                break;
            case 'ai-hard':
                move = this.getHardAIMove();
                break;
        }

        // Ensure AI doesn't exceed thinking time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, maxThinkTime - elapsedTime);
        
        setTimeout(() => {
            if (move && this.gameActive) {
                this.playClickSound();
                if (this.phase === 'placing') {
                    this.placePiece(move.to);
                } else {
                    this.selectedCell = move.from;
                    this.movePiece(move.to);
                }
            }
        }, Math.min(remainingTime, 500));
    }

    getRandomMove() {
        const availableMoves = this.getAvailableMoves();
        if (availableMoves.length === 0) {
            // If no non-repetitive moves available, allow any valid move
            return this.getAllValidMoves()[0] || null;
        }
        
        const strategic = this.getStrategicPositions();
        
        const strategicMoves = availableMoves.filter(move => {
            const pos = this.phase === 'placing' ? move.to : move.to;
            return strategic.includes(pos);
        });
        
        const movesToConsider = strategicMoves.length > 0 ? strategicMoves : availableMoves;
        return movesToConsider[Math.floor(Math.random() * movesToConsider.length)];
    }

    getAllValidMoves() {
        const moves = [];
        
        if (this.phase === 'placing') {
            for (let i = 0; i < this.boardSize * this.boardSize; i++) {
                if (!this.board[i]) {
                    moves.push({ to: i });
                }
            }
        } else {
            for (let from = 0; from < this.boardSize * this.boardSize; from++) {
                if (this.board[from] === this.currentPlayer) {
                    for (let to = 0; to < this.boardSize * this.boardSize; to++) {
                        if (this.isValidMove(from, to)) {
                            moves.push({ from, to });
                        }
                    }
                }
            }
        }
        
        return moves;
    }

    getMediumAIMove() {
        let move = this.findWinningMove(this.aiPlayer);
        if (move) return move;
        
        move = this.findWinningMove(this.humanPlayer);
        if (move) return move;
        
        move = this.findForkMove(this.aiPlayer);
        if (move) return move;
        
        move = this.findForkMove(this.humanPlayer);
        if (move) return move;
        
        if (this.phase === 'placing') {
            const strategic = this.getStrategicPositions();
            for (let pos of strategic) {
                if (!this.board[pos]) {
                    return { to: pos };
                }
            }
        }
        
        return this.getRandomMove();
    }

    getHardAIMove() {
        const depth = this.phase === 'placing' ? 4 : 6;
        return this.minimax(depth, true).move;
    }

    findForkMove(player) {
        const moves = this.getAvailableMoves();
        
        for (let move of moves) {
            const boardCopy = [...this.board];
            if (this.phase === 'placing') {
                boardCopy[move.to] = player;
            } else {
                boardCopy[move.from] = null;
                boardCopy[move.to] = player;
            }
            
            let winningOpportunities = 0;
            const lines = this.getWinningLines();
            
            for (let line of lines) {
                let playerCount = 0;
                let emptyCount = 0;
                
                for (let pos of line) {
                    if (boardCopy[pos] === player) playerCount++;
                    else if (!boardCopy[pos]) emptyCount++;
                }
                
                if (playerCount === this.boardSize - 1 && emptyCount === 1) {
                    winningOpportunities++;
                }
            }
            
            if (winningOpportunities >= 2) {
                return move;
            }
        }
        
        return null;
    }

    minimax(depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
        const winner = this.checkWinOnBoard(this.board);
        
        if (winner) {
            if (this.getWinner(this.board) === this.aiPlayer) return { score: 100 + depth };
            else return { score: -100 - depth };
        }
        
        if (depth === 0) {
            return { score: this.evaluateBoard() };
        }
        
        const moves = this.getAvailableMoves();
        if (moves.length === 0) return { score: 0 };
        
        let bestMove = moves[0];
        
        if (isMaximizing) {
            let maxScore = -Infinity;
            
            for (let move of moves) {
                const oldBoard = [...this.board];
                const oldPlayer = this.currentPlayer;
                
                this.makeTemporaryMove(move);
                this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
                
                const result = this.minimax(depth - 1, false, alpha, beta);
                
                this.board = oldBoard;
                this.currentPlayer = oldPlayer;
                
                if (result.score > maxScore) {
                    maxScore = result.score;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, result.score);
                if (beta <= alpha) break;
            }
            
            return { score: maxScore, move: bestMove };
        } else {
            let minScore = Infinity;
            
            for (let move of moves) {
                const oldBoard = [...this.board];
                const oldPlayer = this.currentPlayer;
                
                this.makeTemporaryMove(move);
                this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
                
                const result = this.minimax(depth - 1, true, alpha, beta);
                
                this.board = oldBoard;
                this.currentPlayer = oldPlayer;
                
                if (result.score < minScore) {
                    minScore = result.score;
                    bestMove = move;
                }
                
                beta = Math.min(beta, result.score);
                if (beta <= alpha) break;
            }
            
            return { score: minScore, move: bestMove };
        }
    }

    makeTemporaryMove(move) {
        if (this.phase === 'placing') {
            this.board[move.to] = this.currentPlayer;
        } else {
            this.board[move.from] = null;
            this.board[move.to] = this.currentPlayer;
        }
    }

    evaluateBoard() {
        let score = 0;
        const lines = this.getWinningLines();
        
        for (let line of lines) {
            score += this.evaluateLine(line);
        }
        
        score += this.evaluatePositions();
        
        return score;
    }

    evaluateLine(line) {
        let aiCount = 0;
        let humanCount = 0;
        let emptyCount = 0;
        
        for (let pos of line) {
            if (this.board[pos] === this.aiPlayer) aiCount++;
            else if (this.board[pos] === this.humanPlayer) humanCount++;
            else emptyCount++;
        }
        
        if (aiCount > 0 && humanCount > 0) return 0;
        
        let score = 0;
        
        if (aiCount > 0) {
            score = Math.pow(10, aiCount);
        } else if (humanCount > 0) {
            score = -Math.pow(10, humanCount);
        }
        
        return score;
    }

    evaluatePositions() {
        let score = 0;
        const center = Math.floor(this.boardSize / 2);
        const centerPos = center * this.boardSize + center;
        
        if (this.board[centerPos] === this.aiPlayer) score += 10;
        else if (this.board[centerPos] === this.humanPlayer) score -= 10;
        
        const corners = [
            0,
            this.boardSize - 1,
            (this.boardSize - 1) * this.boardSize,
            this.boardSize * this.boardSize - 1
        ];
        
        for (let corner of corners) {
            if (this.board[corner] === this.aiPlayer) score += 5;
            else if (this.board[corner] === this.humanPlayer) score -= 5;
        }
        
        const oldPlayer = this.currentPlayer;
        
        this.currentPlayer = this.aiPlayer;
        const aiMoves = this.getAvailableMoves().length;
        
        this.currentPlayer = this.humanPlayer;
        const humanMoves = this.getAvailableMoves().length;
        
        this.currentPlayer = oldPlayer;
        
        score += (aiMoves - humanMoves);
        
        return score;
    }

    getWinner(board) {
        const lines = this.getWinningLines();
        
        for (let line of lines) {
            if (line.every(pos => board[pos] && board[pos] === board[line[0]])) {
                return board[line[0]];
            }
        }
        
        return null;
    }
    
    getStrategicPositions() {
        const center = Math.floor(this.boardSize / 2);
        const centerPos = center * this.boardSize + center;
        
        const corners = [
            0,
            this.boardSize - 1,
            (this.boardSize - 1) * this.boardSize,
            this.boardSize * this.boardSize - 1
        ];
        
        const strategic = [centerPos, ...corners];
        
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            if (!strategic.includes(i)) {
                strategic.push(i);
            }
        }
        
        return strategic;
    }

    findWinningMove(player) {
        const moves = this.getAvailableMoves();
        
        for (let move of moves) {
            const boardCopy = [...this.board];
            if (this.phase === 'placing') {
                boardCopy[move.to] = player;
            } else {
                boardCopy[move.from] = null;
                boardCopy[move.to] = player;
            }
            
            if (this.checkWinOnBoard(boardCopy)) {
                return move;
            }
        }
        return null;
    }

    getAvailableMoves() {
        const moves = [];
        
        if (this.phase === 'placing') {
            for (let i = 0; i < this.boardSize * this.boardSize; i++) {
                if (!this.board[i]) {
                    moves.push({ to: i });
                }
            }
        } else {
            for (let from = 0; from < this.boardSize * this.boardSize; from++) {
                if (this.board[from] === this.currentPlayer) {
                    for (let to = 0; to < this.boardSize * this.boardSize; to++) {
                        if (this.isValidMove(from, to)) {
                            // Filter out repetitive moves for AI
                            if (this.gameMode !== 'multiplayer' && this.currentPlayer === this.aiPlayer) {
                                if (!this.isRepetitiveMove(from, to)) {
                                    moves.push({ from, to });
                                }
                            } else {
                                moves.push({ from, to });
                            }
                        }
                    }
                }
            }
        }
        
        return moves;
    }

    isValidMove(from, to) {
        if (this.board[to]) return false;
        
        const fromRow = Math.floor(from / this.boardSize);
        const fromCol = from % this.boardSize;
        const toRow = Math.floor(to / this.boardSize);
        const toCol = to % this.boardSize;

        return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
    }

    checkWinOnBoard(board) {
        const lines = this.getWinningLines();
        return lines.some(line => {
            return line.every(pos => board[pos] && board[pos] === board[line[0]]);
        });
    }

    getWinningLines() {
        const lines = [];
        
        for (let row = 0; row < this.boardSize; row++) {
            const line = [];
            for (let col = 0; col < this.boardSize; col++) {
                line.push(row * this.boardSize + col);
            }
            lines.push(line);
        }
        
        for (let col = 0; col < this.boardSize; col++) {
            const line = [];
            for (let row = 0; row < this.boardSize; row++) {
                line.push(row * this.boardSize + col);
            }
            lines.push(line);
        }
        
        const diagonal1 = [];
        const diagonal2 = [];
        for (let i = 0; i < this.boardSize; i++) {
            diagonal1.push(i * this.boardSize + i);
            diagonal2.push(i * this.boardSize + (this.boardSize - 1 - i));
        }
        lines.push(diagonal1, diagonal2);
        
        return lines;
    }

    checkWin() {
        return this.checkWinOnBoard(this.board);
    }

    updateStatus() {
        const status = document.getElementById('status');
        if (this.gameMode === 'multiplayer') {
            status.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
        } else {
            if (this.currentPlayer === this.humanPlayer) {
                status.textContent = "Your Turn";
            } else {
                status.textContent = "AI's Turn";
            }
        }
    }

    endGame() {
        this.gameActive = false;
        this.stopMoveTimer();
        const status = document.getElementById('status');
        
        if (this.gameMode === 'multiplayer') {
            status.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} Wins!`;
        } else {
            if (this.currentPlayer === this.humanPlayer) {
                status.textContent = "You Win!";
            } else {
                status.textContent = "AI Wins!";
            }
        }
        
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.cursor = 'not-allowed';
        });
    }
}

new GridWars();
