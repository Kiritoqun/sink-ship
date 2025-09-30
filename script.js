const sinkship = {

    shipCounts: {
        Battleship: 0,
        Cruiser: 0,
        Destroyer: 0,
        Submarine: 0,
    },

    maxShips: {
        Battleship: 1,
        Cruiser: 2,
        Destroyer: 3,
        Submarine: 4,
    },

    createHeader: function(){
        const header = document.createElement('header');

        const title = document.createElement('h1');
        title.textContent = "Sinkship";
        title.classList.add('header-title');

        const subtitle = document.createElement('h2');
        subtitle.textContent = "by Max Ulrich-Ziska";
        subtitle.classList.add('header-subtitle');

        header.appendChild(title);
        header.appendChild(subtitle);

        return header;
    },

    createMain: function(){
        const main = document.createElement('main');
        const limiter = document.createElement('div');
        limiter.classList.add('limiter');

        const controls = document.createElement('div');
        controls.classList.add('controls');

        const serverMessage = document.createElement("div");
        serverMessage.id = "serverMessage";
        serverMessage.classList.add("server-message");
        this.serverMessage = serverMessage;

        const buildButton = document.createElement('button');
        buildButton.textContent = "Build";
        buildButton.addEventListener("click", () => {
            this.resetField();
            this.resetComputerField();
            this.reset();
            document.getElementById("computerfield").style.display = "none";
            document.getElementById("buildMenu").style.display = "block";
            this.disableShipRemoval = false;
            this.autoPlaceButton.disabled = false;
            this.serverMessage.textContent = "";
        });
        this.buildButton = buildButton;

        const playButton = document.createElement('button');
        playButton.textContent = "Play";
        playButton.addEventListener("click", () => {
            this.autoPlaceButton.disabled = true;
            this.disableShipRemoval = true;
            document.getElementById("buildMenu").style.display = "none";
            document.getElementById("computerfield").style.display = "grid";
            this.startServerGame();
        });
        playButton.disabled = true;
        this.playButton = playButton;

        const autoPlaceButton = document.createElement('button');
        autoPlaceButton.textContent = "Auto Place";
        autoPlaceButton.addEventListener("click", () => {
            this.AutoPlace();
        });
        this.autoPlaceButton = autoPlaceButton;

        controls.appendChild(buildButton);
        controls.appendChild(autoPlaceButton);
        controls.appendChild(playButton);
        limiter.appendChild(controls);
        limiter.appendChild(serverMessage);

        const overlay = document.createElement("div");
        overlay.id = "winnerOverlay";
        overlay.style.display = "none";

        const content = document.createElement("div");
        content.classList.add("winner-box");

        const winnerText = document.createElement("div");
        winnerText.id = "winnerText";

        const restartButton = document.createElement("button");
        restartButton.textContent = "Neues Spiel?";
        restartButton.addEventListener("click", () => {
            overlay.style.display = "none";
            this.resetField();
            this.resetComputerField();
            this.reset();
            document.getElementById("computerfield").style.display = "none";
            document.getElementById("buildMenu").style.display = "block";
            this.disableShipRemoval = false;
            this.autoPlaceButton.disabled = false;
            this.serverMessage.textContent = "";
        });

        content.appendChild(winnerText);
        content.appendChild(restartButton);
        overlay.appendChild(content);
        document.body.appendChild(overlay);


        const fields = document.createElement('div');
        fields.classList.add('fields');
        const playerField = this.createField('playerfield');
        const computerField = this.createField('computerfield');
        computerField.style.display = 'none';
        const buildMenu = this.createBuildMenu('buildMenu');

        fields.appendChild(playerField);
        fields.appendChild(computerField);
        fields.appendChild(buildMenu);
        limiter.appendChild(fields);
        main.appendChild(limiter);
        return main;
    },

    createFooter: function() {
        const footer = document.createElement('footer');
        footer.textContent = "© 2025 Max Ulrich-Ziska";
        return footer;
    },
    
    startServerGame: async function () {
        this.serverMessage.textContent = "";
        try {
            const url = "https://www2.hs-esslingen.de/~melcher/it/sinkship/?request=start&userid=maulit00";
                const response = await fetch(url);
                const data = await response.json();
                console.log(data);
            
                if (data.success) {
                    this.serverMessage.textContent = data.statusText;
                    this.token = data.token;
                    this.serverState = data.state;
                    if (data.state === 0 || data.state === 1) this.enableShooting();
                } else {
                    this.serverMessage.textContent = "Fehler beim Starten des Spiels.";
                }
        } catch (err) {
            console.error("Serverfehler:", err);
            this.serverMessage.textContent = "Verbindung zum Server fehlgeschlagen.";
        }
    },

    enableShooting: function () {
        const computerField = document.getElementById("computerfield");

        if (this.serverState !== 1 && this.serverState !== 0) return;
        
        computerField.classList.add("shootable");

        computerField.querySelectorAll(".cell").forEach(cell => {
            const newcell = cell.cloneNode(true);
            cell.replaceWith(newcell);

            newcell.addEventListener("click", async () => {
                if (!computerField.classList.contains("shootable")) return;
                if (newcell.classList.contains("shot") || newcell.classList.contains("processing")) return;

                newcell.classList.add("processing");

                const x = newcell.dataset.x;
                const y = newcell.dataset.y;
                const shootUrl = `https://www2.hs-esslingen.de/~melcher/it/sinkship/?request=shoot&x=${x}&y=${y}&token=${this.token}`;

                try {
                    const response = await fetch(shootUrl);
                    const data = await response.json();
                    console.log(data);

                    this.serverMessage.textContent = data.statusText;

                    newcell.classList.add("shot");
                    if (data.result === 0) {
                        newcell.classList.add("miss");
                    }else {
                        newcell.classList.add("hit");
                    }
                    
                    if (data.state === 2) {
                        this.getshotcoordinates();
                        document.getElementById("computerfield").classList.remove("shootable");
                    } else if (data.state === 4) {
                        this.showWinner("Player wins!");
                        document.getElementById("computerfield").classList.remove("shootable");
                    } else if(data.state ===1 || data.state === 0) {
                    }
                } catch (err) {
                    console.error("Fehler beim Schuss:", err);
                    this.serverMessage.textContent = "Verbindung zum Server fehlgeschlagen.";
                } finally {
                    newcell.classList.remove("processing");
                }
            });
        });
    },

    getshotcoordinates: async function () {
        try {
            const url = `https://www2.hs-esslingen.de/~melcher/it/sinkship/?request=getshotcoordinates&token=${this.token}`;
            const response = await fetch(url);
            const data = await response.json();
            console.log(data);

            if (!data.success) {
                this.serverMessage.textContent = "Fehler beim Holen der Koordinaten.";
                return;
            }

            const { x, y, state } = data;

            this.serverMessage.textContent = `Server hat geschossen auf ${x}, ${y}`;

            const cell = document.querySelector(`#playerfield .cell[data-x="${x}"][data-y="${y}"]`);

            if (cell) {
                const alreadyShot = cell.classList.contains("enemy-shot");

                if (!alreadyShot) {
                    cell.classList.add("enemy-shot");

                    if (cell.classList.contains("ship")) {
                        cell.classList.add("hit");
                    } else {
                        cell.classList.add("miss");
                    }
                }
                this.sendShotResult(x, y);
                
            } else {
                console.log(`Server hat doppelt auf (${x}, ${y}) geschossen. Versuche erneut...`);
                setTimeout(() => this.getshotcoordinates(), 500); 
            }
        } catch (err) {
            console.error("Fehler bei getshotcoordinates:", err);
            this.serverMessage.textContent = "Verbindung zum Server (Koordinaten) fehlgeschlagen.";
        }
    },

    sendShotResult: async function (x, y) {
        const cell = document.querySelector(`#playerfield .cell[data-x="${x}"][data-y="${y}"]`);
        let result = 0;

        if (cell && cell.classList.contains("enemy-shot")) {
            if (cell.classList.contains("ship")) {
                const shipId = cell.dataset.shipId;
                const shipCells = document.querySelectorAll(`#playerfield .cell[data-ship-id="${shipId}"]`);
                const allHit = [...shipCells].every(c => c.classList.contains("enemy-shot"));

                result = allHit ? 2 : 1;
            } else {
                result = 0;
            }
        }

        try {
            const url = `https://www2.hs-esslingen.de/~melcher/it/sinkship/?request=sendingresult&result=${result}&token=${this.token}`;
            const response = await fetch(url);
            const data = await response.json();
            console.log(data);

            if (data.success) {
                this.serverMessage.textContent = data.statusText;
                this.serverState = data.state;

                if (data.state === 0 || data.state === 1) {
                    console.log("Du musst schießen");
                    this.serverState = data.state;
                    this.enableShooting();
                }else if (data.state === 2) {
                    console.log("Server hat getroffen - schießt erneut.");
                    this.getshotcoordinates();
                } else if (data.state === 4) {
                    this.showWinner("Server wins!");
                }
            } else {
                this.serverMessage.textContent = "Fehler beim Senden des Schussergebnisses.";
            }
        } catch (err) {
            console.error("Fehler beim Senden des Schussergebnisses:", err);
            this.serverMessage.textContent = "Verbindung zum Server (sendingresult) fehlgeschlagen.";
        }
    },

    currentSelection: null,

    createBuildMenu: function(id) {
        const container = document.createElement('div');
        container.classList.add('field');
        container.id = id;

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tableRow = document.createElement('tr');

        ['Number', 'Ships', 'Type', 'Size'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            tableRow.appendChild(th);
        });

        thead.appendChild(tableRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        this.selectionButtons = {};

        const rows = [
            {count: 1, type: "Battleship", size: 5},
            {count: 2, type: "Cruiser", size: 4},
            {count: 3, type: "Destroyer", size: 3},
            {count: 4, type: "Submarine", size: 2},
            ];

        rows.forEach(({ count, type, size }) => {
            const row = document.createElement("tr");

            const countCell = document.createElement("td");
            countCell.textContent = count;

            const imageCell = document.createElement("td");
            imageCell.style.display = "flex";
            imageCell.style.gap = "0.5em";
            imageCell.style.justifyContent = "center";

            const hCell = document.createElement("div");
            hCell.classList.add("h", type, "select");
            hCell.style.width = "40px";
            hCell.style.height = "40px";

            hCell.addEventListener("click", () => {
                /*
                console.log({
                    type: type,
                    size: size,
                    orientation: "h"
                });
                */
                this.currentSelection = { 
                    type: type,
                    size: size,
                    orientation: "h"
                };
                sinkship.highlightValidCells();
            });        

            const vCell = document.createElement("div");
            vCell.classList.add("v", type, "select");
            vCell.style.height = "40px";
            vCell.style.width = "40px";

            vCell.addEventListener("click", () => {
                /*
                console.log({
                    type: type,
                    size: size,
                    orientation: "v"
                });
                */
                this.currentSelection = { 
                    type: type,
                    size: size,
                    orientation: "v"
                };
                sinkship.highlightValidCells();
            });

            this.selectionButtons[type] = this.selectionButtons[type] || [];
            this.selectionButtons[type].push(hCell, vCell);

            imageCell.appendChild(hCell);
            imageCell.appendChild(vCell);

            const typeCell = document.createElement("td");
            typeCell.textContent = type;
            const sizeCell = document.createElement("td");
            sizeCell.textContent = size;

            row.appendChild(countCell);
            row.appendChild(imageCell);
            row.appendChild(typeCell);
            row.appendChild(sizeCell);
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        container.appendChild(table);
        return container;
    },

    placeShip: function(type, size) {
        const orientations = ["h", "v"];
        const field = document.getElementById("playerfield");

        for (let attempt = 0; attempt < 1000; attempt++) {
            const orientation = orientations[Math.floor(Math.random() * orientations.length)];
            const x = Math.floor(Math.random() * (orientation === "h" ? 10 - size + 1 : 10));
            const y = Math.floor(Math.random() * (orientation === "v" ? 10 - size + 1 : 10));

            let shipCells = [];
            let neighborCells = [];
            let isValid = true;

            for (let i = 0; i < size; i++) {
                const dx = orientation === "h" ? x + i : x;
                const dy = orientation === "v" ? y + i : y;
                const cell = field.querySelector(`.cell[data-x="${dx}"][data-y="${dy}"]`);
                if (!cell || cell.classList.contains("ship")) {
                    isValid = false;
                    break;
                }
                shipCells.push(cell);
                const neighbors = [
                    [dx, dy - 1],
                    [dx - 1, dy],
                    [dx + 1, dy],
                    [dx, dy + 1]
                ];
                neighborCells.push(...neighbors);
            }
            
            for (const [nx, ny] of neighborCells) {
                const neighbor = field.querySelector(`.cell[data-x="${nx}"][data-y="${ny}"]`);
                if (neighbor && neighbor.classList.contains("ship")) {
                    isValid = false;
                    break;
                }
            }

            if (isValid) {
                const shipId = "ship_" + this.shipIdCounter++;
                shipCells.forEach((cell, i) => {
                    cell.className = "cell ship";
                    Object.assign(cell.dataset, {
                        ship: type,
                        orientation,
                        index: i,
                        shipId
                    });

                    if (orientation === 'h') {
                        cell.classList.add(i === 0 ? "left" : i === size - 1 ? "right" : "mid_h");
                    } else {
                        cell.classList.add(i === 0 ? "top" : i === size - 1 ? "bottom" : "mid_v");
                    }
                });

                this.shipCounts[type]++;
                if (this.shipCounts[type] >= this.maxShips[type]) {
                    this.selectionButtons[type].forEach(btn => {
                        btn.style.opacity = "0.35";
                        btn.style.pointerEvents = "none";
                    });
                }
                return true;
            }
        }
        return false;
    },

    AutoPlace: function() {
        this.resetField();

        const types = Object.keys(this.maxShips);
        const sizes = {
            Battleship: 5,
            Cruiser: 4,
            Destroyer: 3,
            Submarine: 2
        };

        Object.keys(this.maxShips).forEach(type => {
            const size = sizes[type];
            for (let i = 0; i < this.maxShips[type]; i++) {
                this.placeShip(type, size);
            }
        });

        this.currentSelection = null;
        this.highlightValidCells();

        const allPlaced = Object.keys(this.maxShips).every(
            type => this.shipCounts[type] >= this.maxShips[type]
        );
        this.playButton.disabled = !allPlaced;
    },

    resetField: function() {
        const playerField = document.getElementById('playerfield');
        const cells = playerField.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.className = 'cell water';
            ["ship", "orientation", "index", "shipId"].forEach(attr => delete cell.dataset[attr]);
        });
        this.shipCounts = {
            Battleship: 0,
            Cruiser: 0,
            Destroyer: 0,
            Submarine: 0
        };
        for (let type in this.selectionButtons) {
            this.selectionButtons[type].forEach(btn => {
                btn.style.opacity = "1";
                btn.style.pointerEvents = "auto";
            });
        }
        this.currentSelection = null;
        this.highlightValidCells();
        this.playButton.disabled = true;
    },

    resetComputerField: function () {
        const computerField = document.getElementById("computerfield");

        computerField.querySelectorAll(".cell").forEach(cell => {
            cell.className = "cell water";
            cell.replaceWith(cell.cloneNode(true));
        });
        computerField.classList.remove("shootable");
    },

    highlightValidCells: function(){    
        if (!this.currentSelection) {
            const field = document.getElementById("playerfield");
            field.classList.remove("cursor");

            const cells = Array.from(field.querySelectorAll(".cell"));

            cells.forEach(cell => {
                cell.classList.remove("valid", "invalid");
            });
            return;
        }

        const field = document.getElementById("playerfield");
            field.classList.add("cursor");

            const cells = Array.from(field.querySelectorAll(".cell"));

            cells.forEach(cell => {
                cell.classList.remove("valid", "invalid");
            });

        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const { size, orientation } = this.currentSelection;

            let isValid = true;
                for (let i = 0; i < size; i++) {
                    const dx = orientation === "h" ? x + i : x;
                    const dy = orientation === "v" ? y + i : y;

                    const targetCell = [...cells].find(c => c.dataset.x == dx && c.dataset.y == dy);
                    if (!targetCell || targetCell.classList.contains('ship')) {
                        isValid = false;
                        break;
                }

                const neighbors = [
                    [dx, dy - 1],
                    [dx - 1, dy],
                    [dx + 1, dy],
                    [dx, dy + 1]
                ];

                for (const [nx, ny] of neighbors) {
                    const neighbor = cells.find(c => c.dataset.x == nx && c.dataset.y == ny);
                    if (neighbor && neighbor.classList.contains('ship')) {
                        isValid = false;
                        break;
                    }
                }
            }
            if (isValid) {
                cell.classList.add('valid');
            } else {
                cell.classList.add('invalid');
            }
        });
    },

    createField: function (id) {
        const field = document.createElement('div');
        field.classList.add('field');
        field.id = id;

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', 'water');

                cell.dataset.x = x;
                cell.dataset.y = y;

                field.appendChild(cell);
            }
        }
        return field;
    },
    
    shipIdCounter: 0,

    attachCellEvents: function () {
        const playerField = document.getElementById('playerfield');

        playerField.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', () => {

                const shipId = cell.dataset.shipId;
                const isShip = cell.classList.contains("ship");

                if (!this.currentSelection && isShip && shipId && !this.disableShipRemoval) {
                    const shipCells = playerField.querySelectorAll(`.cell[data-ship-id="${shipId}"]`);
                    const type = shipCells[0]?.dataset.ship;

                    shipCells.forEach(c => {
                        c.className = "cell water";
                        ["ship", "orientation", "index", "shipId"].forEach(attr => delete c.dataset[attr]);
                    });
                    if (type) {
                        this.shipCounts[type]--;
                        if (this.shipCounts[type] < this.maxShips[type]) {
                            this.selectionButtons[type].forEach(btn => {
                                btn.style.opacity = "1";
                                btn.style.pointerEvents = "auto";
                            });
                        }
                    }
                    const allPlaced = Object.keys(this.maxShips).every(
                        type => this.shipCounts[type] >= this.maxShips[type]
                    );
                    this.playButton.disabled = !allPlaced;
                    this.highlightValidCells();
                    return;
                }
                if (!this.currentSelection || !cell.classList.contains("valid")) return;

                const { type, size, orientation } = this.currentSelection;
                const startX = parseInt(cell.dataset.x);
                const startY = parseInt(cell.dataset.y);
                const newShipId = "ship_" + this.shipIdCounter++;

                for (let i = 0; i < size; i++) {
                    const dx = orientation === 'h' ? startX + i : startX;
                    const dy = orientation === 'v' ? startY + i : startY;
                    const target = playerField.querySelector(`.cell[data-x="${dx}"][data-y="${dy}"]`);
                    if (!target) return;

                    target.className = "cell ship";
                    Object.assign(target.dataset, {
                        ship: type,
                        orientation,
                        index: i,
                        shipId: newShipId
                    });

                    if (orientation === 'h') {
                        target.classList.add(i === 0 ? "left" : i === size - 1 ? "right" : "mid_h");
                    }else {
                        target.classList.add(i === 0 ? "top" : i === size - 1 ? "bottom" : "mid_v");
                    }
                }

                this.shipCounts[type]++;

                if (this.shipCounts[type] >= this.maxShips[type]) {
                    this.selectionButtons[type].forEach(btn => {
                        btn.style.opacity = "0.35";
                        btn.style.pointerEvents = "none";
                    });
                }

                const allPlaced = Object.keys(this.maxShips).every(
                    type => this.shipCounts[type] >= this.maxShips[type]
                );

                if (allPlaced) {
                    this.playButton.disabled = false;
                }
                this.currentSelection = null;
                this.highlightValidCells();
            });
        });
    },

    showWinner: function (message) {
        const overlay = document.getElementById("winnerOverlay");
        const winnerText = document.getElementById("winnerText");

        winnerText.textContent = message;
        overlay.style.display = "flex";
    },

    reset: function() { 
        document.getElementById("playerfield").classList.remove("rainbow-mode");
        document.getElementById("computerfield").classList.add("rainbow-mode");
    },
    
    toggleEasterEgg: function () {
        const playerField = document.getElementById("playerfield");
        const computerField = document.getElementById("computerfield");

        const isActive = playerField.classList.contains("rainbow-mode");

        if (isActive) {
            playerField.classList.remove("rainbow-mode");
            computerField.classList.remove("rainbow-mode");
            console.log("Rainbow-Modus deaktiviert");
        } else {
            playerField.classList.add("rainbow-mode");
            computerField.classList.add("rainbow-mode");
            console.log("Das geheime Flottenkommando wurde aktiviert");
        }
    },

    cheatWin: function () { //shift + w + i + n
        const computerField = document.getElementById("computerfield");
        const cells = computerField.querySelectorAll(".cell");

        cells.forEach(cell => {
            if (!cell.classList.contains("shot")) {
                cell.classList.add("shot");
                if (Math.random() < 0.3) {
                    cell.classList.remove("water");
                    cell.classList.add("hit");
                } else {
                    cell.classList.add("miss");
                }
            }
        });
        this.serverMessage.textContent = "You have sunk my last Ship - You win!";
        this.showWinner("Player wins!");
        computerField.classList.remove("shootable");
        console.log("Sieg erzwungen");
    },

    setupEasterEgg: function () {
        let cheatBuffer = [];

        window.addEventListener("keydown", (e) => {
            // SHIFT + W
            if (e.shiftKey && e.key.toLowerCase() === "w") {
                cheatBuffer = ["w"];
            }
            // danach I
            else if (cheatBuffer.length === 1 && e.key.toLowerCase() === "i") {
                cheatBuffer.push("i");
            }
            // danach N → auslösen
            else if (cheatBuffer.length === 2 && e.key.toLowerCase() === "n") {
                cheatBuffer.push("n");
                this.cheatWin(); // 🔥 gewinne sofort
                cheatBuffer = [];
            }
            // wenn etwas anderes gedrückt wird, Buffer zurücksetzen
            else {
                cheatBuffer = [];
            }
        });
    },



    init: function() {
        this.disableShipRemoval = false;

        this.setupEasterEgg();

        const header = this.createHeader();
        const main = this.createMain();
        const footer = this.createFooter();

        document.body.appendChild(header);
        document.body.appendChild(main);
        document.body.appendChild(footer);

        this.attachCellEvents();
    },
};

window.onload = function() {
    sinkship.init();
};