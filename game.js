class SecurityGuardGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Game state
        this.gameStarted = false;
        this.isAsleep = false;
        this.gameOver = false;
        this.survivalTime = 0;
        
        // Action bar mechanics
        this.actionBarValue = 100; // 0-100
        this.actionBarDepletionRate = 0.15; // starts slower
        this.baseDepletionRate = 0.15;
        this.maxDepletionRate = 0.8; // reduced max difficulty
        this.difficultyIncrease = 0.0003; // much more gradual increase
        this.difficultyLevel = 0; // tracks current difficulty level
        
        // Monster mechanics
        this.monsterDistance = 100; // meters
        this.monsterSpeed = 0.5; // meters per second when asleep
        
        // Abilities
        this.coffeeUses = 4;
        this.lightUses = 3;
        this.napCooldown = 0;
        this.napCooldownTime = 5000; // 5 seconds
        
        // Audio context for sound effects
        this.audioContext = null;
        this.initAudio();
        
        // Graphics
        this.environmentOffset = 0;
        this.cloudPositions = this.generateClouds();
        this.treePositions = this.generateTrees();
        this.buildingPositions = this.generateBuildings();
        
        // Input handling
        this.setupEventListeners();
        
        // Game loop
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    generateClouds() {
        const clouds = [];
        for (let i = 0; i < 8; i++) {
            clouds.push({
                x: Math.random() * this.canvas.width * 2,
                y: Math.random() * 150 + 50,
                size: Math.random() * 60 + 40,
                speed: Math.random() * 0.2 + 0.1
            });
        }
        return clouds;
    }
    
    generateTrees() {
        const trees = [];
        for (let i = 0; i < 15; i++) {
            trees.push({
                x: Math.random() * this.canvas.width * 3,
                height: Math.random() * 100 + 80,
                width: Math.random() * 20 + 15
            });
        }
        return trees;
    }
    
    generateBuildings() {
        const buildings = [];
        for (let i = 0; i < 8; i++) {
            buildings.push({
                x: Math.random() * this.canvas.width * 2,
                height: Math.random() * 150 + 100,
                width: Math.random() * 80 + 60
            });
        }
        return buildings;
    }
    
    setupEventListeners() {
        // Mouse click for action bar
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameStarted) {
                this.startGame();
                return;
            }
            
            if (!this.isAsleep && !this.gameOver) {
                this.clickToStayAwake();
            }
        });
        
        // Keyboard for abilities
        document.addEventListener('keydown', (e) => {
            if (!this.gameStarted || this.isAsleep || this.gameOver) return;
            
            switch(e.key) {
                case '1':
                    this.useNap();
                    break;
                case '2':
                    this.useCoffee();
                    break;
                case '3':
                    this.useSecurityLight();
                    break;
            }
        });
        
        // Resize handling
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    startGame() {
        this.gameStarted = true;
        document.getElementById('instructions').classList.add('hidden');
        this.playSound(440, 0.2);
    }
    
    clickToStayAwake() {
        this.actionBarValue = Math.min(100, this.actionBarValue + 8);
        this.playSound(800, 0.1);
    }
    
    useNap() {
        if (this.napCooldown > 0) return;
        
        this.actionBarValue = Math.min(100, this.actionBarValue + 30);
        this.napCooldown = this.napCooldownTime;
        this.playSound(300, 0.3);
        this.updateAbilityUI();
    }
    
    useCoffee() {
        if (this.coffeeUses <= 0) return;
        
        this.actionBarValue = 100;
        this.coffeeUses--;
        this.actionBarDepletionRate = 0; // Stop depletion temporarily
        
        setTimeout(() => {
            this.actionBarDepletionRate = this.baseDepletionRate;
        }, 3000); // 3 seconds of no depletion
        
        this.playSound(600, 0.4);
        this.updateAbilityUI();
    }
    
    useSecurityLight() {
        if (this.lightUses <= 0) return;
        
        this.monsterDistance = Math.min(100, this.monsterDistance + 15);
        this.lightUses--;
        this.playSound(1200, 0.5, 'square');
        this.updateAbilityUI();
        
        // Visual flash effect
        this.flashLight();
    }
    
    flashLight() {
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(255, 255, 255, 0.3)';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '15';
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 200);
    }
    
    updateAbilityUI() {
        const napAbility = document.getElementById('napAbility');
        const coffeeAbility = document.getElementById('coffeeAbility');
        const lightAbility = document.getElementById('lightAbility');
        
        // Nap ability
        if (this.napCooldown > 0) {
            napAbility.className = 'ability unavailable';
            napAbility.textContent = `1 - Quick Nap (${Math.ceil(this.napCooldown / 1000)}s)`;
        } else {
            napAbility.className = 'ability available';
            napAbility.textContent = '1 - Quick Nap (Restore 30%)';
        }
        
        // Coffee ability
        if (this.coffeeUses > 0) {
            coffeeAbility.className = 'ability available';
            coffeeAbility.textContent = `2 - Coffee (${this.coffeeUses} remaining)`;
        } else {
            coffeeAbility.className = 'ability unavailable';
            coffeeAbility.textContent = '2 - Coffee (0 remaining)';
        }
        
        // Light ability
        if (this.lightUses > 0) {
            lightAbility.className = 'ability available';
            lightAbility.textContent = `3 - Security Light (${this.lightUses} remaining)`;
        } else {
            lightAbility.className = 'ability unavailable';
            lightAbility.textContent = '3 - Security Light (0 remaining)';
        }
    }
    
    fallAsleep() {
        this.isAsleep = true;
        this.playSound(200, 2, 'sawtooth');
        
        // Show sleep overlay
        const overlay = document.getElementById('sleepOverlay');
        const sleepText = document.getElementById('sleepText');
        
        overlay.classList.add('active');
        sleepText.classList.add('show');
        
        // Monster movement sounds and progression
        const sleepDuration = 3000; // 3 seconds
        const soundInterval = setInterval(() => {
            this.playSound(150, 0.3, 'triangle');
        }, 500);
        
        setTimeout(() => {
            clearInterval(soundInterval);
            this.wakeUp();
        }, sleepDuration);
    }
    
    wakeUp() {
        this.isAsleep = false;
        this.actionBarValue = 100;
        
        // Reset difficulty progression after monster advances
        this.difficultyLevel = Math.max(0, this.difficultyLevel - 0.3);
        this.actionBarDepletionRate = Math.max(
            this.baseDepletionRate,
            this.baseDepletionRate + (this.difficultyLevel * this.difficultyIncrease * 1000)
        );
        
        // Hide sleep overlay
        const overlay = document.getElementById('sleepOverlay');
        const sleepText = document.getElementById('sleepText');
        
        overlay.classList.remove('active');
        sleepText.classList.remove('show');
        
        this.playSound(440, 0.3);
    }
    
    checkGameOver() {
        if (this.monsterDistance <= 0) {
            this.gameOver = true;
            this.playSound(100, 3, 'sawtooth');
            
            setTimeout(() => {
                alert(`Game Over! You survived for ${Math.floor(this.survivalTime / 1000)} seconds.\nThe monster caught you!\n\nRefresh to play again.`);
            }, 1000);
        }
    }
    
    update(deltaTime) {
        if (!this.gameStarted || this.gameOver) return;
        
        this.survivalTime += deltaTime;
        
        // Update cooldowns
        if (this.napCooldown > 0) {
            this.napCooldown = Math.max(0, this.napCooldown - deltaTime);
        }
        
        // Increase difficulty over time more gradually
        this.difficultyLevel += deltaTime * this.difficultyIncrease;
        this.actionBarDepletionRate = Math.min(
            this.maxDepletionRate,
            this.baseDepletionRate + (this.difficultyLevel * 0.001)
        );
        
        if (!this.isAsleep) {
            // Deplete action bar
            this.actionBarValue -= this.actionBarDepletionRate * (deltaTime / 16.67); // Normalize to 60fps
            
            if (this.actionBarValue <= 0) {
                this.actionBarValue = 0;
                this.fallAsleep();
            }
        } else {
            // Monster moves forward when asleep
            this.monsterDistance -= this.monsterSpeed * (deltaTime / 1000);
        }
        
        // Update UI
        this.updateActionBar();
        this.updateMonsterDistance();
        this.updateAbilityUI();
        
        // Check win/lose conditions
        this.checkGameOver();
    }
    
    updateActionBar() {
        const fill = document.getElementById('actionBarFill');
        fill.style.width = `${this.actionBarValue}%`;
    }
    
    updateMonsterDistance() {
        const distanceElement = document.getElementById('distanceValue');
        distanceElement.textContent = `${Math.max(0, Math.floor(this.monsterDistance))}m`;
        
        // Change color based on distance
        if (this.monsterDistance < 20) {
            distanceElement.style.color = '#ff4444';
        } else if (this.monsterDistance < 50) {
            distanceElement.style.color = '#ffaa44';
        } else {
            distanceElement.style.color = '#44ff44';
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render night sky
        this.renderSky();
        
        // Render environment
        this.renderEnvironment();
        
        // Render monster
        this.renderMonster();
        
        // Render crosshair
        this.renderCrosshair();
    }
    
    renderSky() {
        // Night sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height / 2);
        gradient.addColorStop(0, '#001133');
        gradient.addColorStop(1, '#002244');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
        
        // Stars
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137) % this.canvas.width;
            const y = (i * 73) % (this.canvas.height / 3);
            const brightness = Math.sin(this.survivalTime * 0.001 + i) * 0.5 + 0.5;
            this.ctx.globalAlpha = brightness * 0.8;
            this.ctx.fillRect(x, y, 2, 2);
        }
        this.ctx.globalAlpha = 1;
        
        // Clouds
        this.cloudPositions.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x < -cloud.size) {
                cloud.x = this.canvas.width + cloud.size;
            }
            
            this.ctx.fillStyle = 'rgba(40, 40, 60, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    renderEnvironment() {
        const groundLevel = this.canvas.height * 0.7;
        
        // Ground
        this.ctx.fillStyle = '#1a3d2e';
        this.ctx.fillRect(0, groundLevel, this.canvas.width, this.canvas.height - groundLevel);
        
        // Grass texture
        this.ctx.fillStyle = '#2d5a3d';
        for (let i = 0; i < this.canvas.width; i += 3) {
            const height = Math.sin(i * 0.1 + this.survivalTime * 0.001) * 5 + 3;
            this.ctx.fillRect(i, groundLevel - height, 2, height);
        }
        
        // Buildings in background
        this.buildingPositions.forEach(building => {
            const x = building.x - (this.environmentOffset * 0.3);
            if (x > -building.width && x < this.canvas.width + building.width) {
                this.ctx.fillStyle = '#0a0a0a';
                this.ctx.fillRect(x, groundLevel - building.height, building.width, building.height);
                
                // Building windows
                this.ctx.fillStyle = '#444422';
                for (let w = 0; w < building.width; w += 15) {
                    for (let h = 20; h < building.height; h += 25) {
                        if (Math.random() > 0.7) {
                            this.ctx.fillRect(x + w + 2, groundLevel - building.height + h, 8, 12);
                        }
                    }
                }
            }
        });
        
        // Trees
        this.treePositions.forEach(tree => {
            const x = tree.x - (this.environmentOffset * 0.5);
            if (x > -tree.width && x < this.canvas.width + tree.width) {
                // Tree trunk
                this.ctx.fillStyle = '#2d1810';
                this.ctx.fillRect(x, groundLevel - tree.height * 0.3, tree.width * 0.3, tree.height * 0.3);
                
                // Tree foliage
                this.ctx.fillStyle = '#1a3d1a';
                this.ctx.beginPath();
                this.ctx.arc(x + tree.width * 0.15, groundLevel - tree.height * 0.5, tree.width * 0.7, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    renderMonster() {
        if (this.monsterDistance >= 100) return;
        
        const groundLevel = this.canvas.height * 0.7;
        const monsterProgress = 1 - (this.monsterDistance / 100);
        const monsterSize = 50 + (monsterProgress * 200); // Gets bigger as it approaches
        const monsterX = this.canvas.width / 2;
        const monsterY = groundLevel - monsterSize;
        
        // Monster shadow/silhouette
        this.ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + monsterProgress * 0.7})`;
        
        // Monster body (scary shape)
        this.ctx.beginPath();
        
        // Main body
        this.ctx.ellipse(monsterX, monsterY, monsterSize * 0.4, monsterSize * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Arms/appendages
        const armOffset = Math.sin(this.survivalTime * 0.003) * 10;
        this.ctx.fillRect(monsterX - monsterSize * 0.7, monsterY - monsterSize * 0.2 + armOffset, monsterSize * 0.3, monsterSize * 0.8);
        this.ctx.fillRect(monsterX + monsterSize * 0.4, monsterY - monsterSize * 0.2 - armOffset, monsterSize * 0.3, monsterSize * 0.8);
        
        // Eyes (glowing red dots)
        if (this.monsterDistance < 50) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(monsterX - monsterSize * 0.15, monsterY - monsterSize * 0.3, 5 + monsterProgress * 5, 0, Math.PI * 2);
            this.ctx.arc(monsterX + monsterSize * 0.15, monsterY - monsterSize * 0.3, 5 + monsterProgress * 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    renderCrosshair() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Horizontal line
        this.ctx.moveTo(centerX - 10, centerY);
        this.ctx.lineTo(centerX + 10, centerY);
        
        // Vertical line
        this.ctx.moveTo(centerX, centerY - 10);
        this.ctx.lineTo(centerX, centerY + 10);
        
        this.ctx.stroke();
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new SecurityGuardGame();
});