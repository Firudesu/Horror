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
        this.constructionEquipment = this.generateConstructionEquipment();
        this.fencePositions = this.generateFences();
        this.lightPoles = this.generateLightPoles();
        this.particleSystem = [];
        this.fogOpacity = 0.1;
        
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
        for (let i = 0; i < 12; i++) {
            buildings.push({
                x: Math.random() * this.canvas.width * 3,
                height: Math.random() * 200 + 120,
                width: Math.random() * 100 + 80,
                type: Math.floor(Math.random() * 3), // Different building types
                windowPattern: Math.floor(Math.random() * 4),
                craneHeight: Math.random() * 100 + 50
            });
        }
        return buildings;
    }
    
    generateConstructionEquipment() {
        const equipment = [];
        for (let i = 0; i < 8; i++) {
            equipment.push({
                x: Math.random() * this.canvas.width * 2,
                type: Math.floor(Math.random() * 4), // excavator, crane, truck, etc.
                size: Math.random() * 30 + 20
            });
        }
        return equipment;
    }
    
    generateFences() {
        const fences = [];
        for (let i = 0; i < 15; i++) {
            fences.push({
                x: Math.random() * this.canvas.width * 2,
                height: 40 + Math.random() * 20,
                posts: Math.floor(Math.random() * 8) + 4
            });
        }
        return fences;
    }
    
    generateLightPoles() {
        const poles = [];
        for (let i = 0; i < 6; i++) {
            poles.push({
                x: Math.random() * this.canvas.width * 2,
                height: 80 + Math.random() * 40,
                flickering: Math.random() > 0.7,
                brightness: Math.random()
            });
        }
        return poles;
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
        // Enhanced night sky gradient with more depth
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height / 2);
        gradient.addColorStop(0, '#000811');
        gradient.addColorStop(0.3, '#001133');
        gradient.addColorStop(0.7, '#002244');
        gradient.addColorStop(1, '#003355');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
        
        // Moon with glow
        const moonX = this.canvas.width * 0.8;
        const moonY = this.canvas.height * 0.15;
        const moonRadius = 30;
        
        // Moon glow
        const moonGlow = this.ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius * 3);
        moonGlow.addColorStop(0, 'rgba(220, 220, 255, 0.1)');
        moonGlow.addColorStop(1, 'rgba(220, 220, 255, 0)');
        this.ctx.fillStyle = moonGlow;
        this.ctx.fillRect(moonX - moonRadius * 3, moonY - moonRadius * 3, moonRadius * 6, moonRadius * 6);
        
        // Moon surface
        this.ctx.fillStyle = '#e6e6ff';
        this.ctx.beginPath();
        this.ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Moon craters
        this.ctx.fillStyle = 'rgba(200, 200, 230, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(moonX - 8, moonY - 5, 4, 0, Math.PI * 2);
        this.ctx.arc(moonX + 6, moonY + 8, 3, 0, Math.PI * 2);
        this.ctx.arc(moonX - 2, moonY + 10, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enhanced stars with twinkling
        for (let i = 0; i < 120; i++) {
            const x = (i * 137) % this.canvas.width;
            const y = (i * 73) % (this.canvas.height / 2.5);
            const brightness = Math.sin(this.survivalTime * 0.002 + i) * 0.5 + 0.5;
            const size = Math.sin(this.survivalTime * 0.003 + i * 2) * 0.5 + 1;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.9})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Occasional bright stars
            if (i % 15 === 0) {
                this.ctx.fillStyle = `rgba(255, 255, 200, ${brightness * 0.6})`;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size + 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Enhanced clouds with more detail
        this.cloudPositions.forEach((cloud, index) => {
            cloud.x -= cloud.speed;
            if (cloud.x < -cloud.size * 2) {
                cloud.x = this.canvas.width + cloud.size;
            }
            
            // Multiple cloud layers for depth
            const layers = 3;
            for (let layer = 0; layer < layers; layer++) {
                const offset = layer * 8;
                const opacity = 0.4 - (layer * 0.1);
                const layerSize = cloud.size - (layer * 5);
                
                this.ctx.fillStyle = `rgba(${30 + layer * 10}, ${30 + layer * 10}, ${50 + layer * 15}, ${opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(cloud.x + offset, cloud.y + offset, layerSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Atmospheric fog/haze
        const fogGradient = this.ctx.createLinearGradient(0, this.canvas.height * 0.3, 0, this.canvas.height * 0.7);
        fogGradient.addColorStop(0, `rgba(40, 50, 80, 0)`);
        fogGradient.addColorStop(1, `rgba(40, 50, 80, ${this.fogOpacity})`);
        this.ctx.fillStyle = fogGradient;
        this.ctx.fillRect(0, this.canvas.height * 0.3, this.canvas.width, this.canvas.height * 0.4);
    }
    
    renderEnvironment() {
        const groundLevel = this.canvas.height * 0.7;
        
        // Enhanced ground with texture and dirt patches
        const groundGradient = this.ctx.createLinearGradient(0, groundLevel, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#2a4a3a');
        groundGradient.addColorStop(0.3, '#1a3d2e');
        groundGradient.addColorStop(1, '#0f2a1f');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, groundLevel, this.canvas.width, this.canvas.height - groundLevel);
        
        // Dirt patches and construction debris
        for (let i = 0; i < this.canvas.width; i += 20) {
            if (Math.sin(i * 0.05) > 0.3) {
                this.ctx.fillStyle = '#3d2817';
                this.ctx.fillRect(i, groundLevel + Math.sin(i * 0.1) * 10, 15, 8);
            }
        }
        
        // Enhanced grass texture with wind effect
        this.ctx.fillStyle = '#2d5a3d';
        for (let i = 0; i < this.canvas.width; i += 2) {
            const windEffect = Math.sin(this.survivalTime * 0.002 + i * 0.01) * 2;
            const height = Math.sin(i * 0.1 + this.survivalTime * 0.001) * 4 + 5 + windEffect;
            const grassShade = Math.sin(i * 0.05) * 20 + 45;
            this.ctx.fillStyle = `rgb(${grassShade - 10}, ${grassShade + 20}, ${grassShade - 5})`;
            this.ctx.fillRect(i, groundLevel - height, 1, height);
        }
        
        // Construction fences
        this.fencePositions.forEach(fence => {
            const x = fence.x - (this.environmentOffset * 0.6);
            if (x > -100 && x < this.canvas.width + 100) {
                // Fence posts
                this.ctx.fillStyle = '#4a4a4a';
                for (let p = 0; p < fence.posts; p++) {
                    const postX = x + (p * 15);
                    this.ctx.fillRect(postX, groundLevel - fence.height, 3, fence.height);
                }
                
                // Chain link pattern
                this.ctx.strokeStyle = '#666666';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                for (let h = 0; h < fence.height; h += 8) {
                    this.ctx.moveTo(x, groundLevel - h);
                    this.ctx.lineTo(x + fence.posts * 15, groundLevel - h);
                }
                this.ctx.stroke();
            }
        });
        
        // Construction equipment
        this.constructionEquipment.forEach(equipment => {
            const x = equipment.x - (this.environmentOffset * 0.7);
            if (x > -equipment.size && x < this.canvas.width + equipment.size) {
                this.renderConstructionEquipment(x, groundLevel, equipment);
            }
        });
        
        // Light poles with illumination
        this.lightPoles.forEach(pole => {
            const x = pole.x - (this.environmentOffset * 0.4);
            if (x > -50 && x < this.canvas.width + 50) {
                // Pole
                this.ctx.fillStyle = '#555555';
                this.ctx.fillRect(x, groundLevel - pole.height, 4, pole.height);
                
                // Light fixture
                this.ctx.fillStyle = '#777777';
                this.ctx.fillRect(x - 8, groundLevel - pole.height, 20, 12);
                
                // Light glow effect
                const flickerIntensity = pole.flickering ? 
                    Math.sin(this.survivalTime * 0.01) * 0.3 + 0.7 : 1.0;
                const lightRadius = 80 * flickerIntensity;
                
                const lightGradient = this.ctx.createRadialGradient(
                    x + 4, groundLevel - pole.height, 0,
                    x + 4, groundLevel - pole.height, lightRadius
                );
                lightGradient.addColorStop(0, `rgba(255, 240, 180, ${0.15 * flickerIntensity})`);
                lightGradient.addColorStop(1, 'rgba(255, 240, 180, 0)');
                
                this.ctx.fillStyle = lightGradient;
                this.ctx.fillRect(x - lightRadius, groundLevel - pole.height - lightRadius, 
                                lightRadius * 2, lightRadius * 2);
            }
        });
        
        // Enhanced buildings with more detail
        this.buildingPositions.forEach(building => {
            const x = building.x - (this.environmentOffset * 0.3);
            if (x > -building.width && x < this.canvas.width + building.width) {
                this.renderDetailedBuilding(x, groundLevel, building);
            }
        });
        
        // Enhanced trees with more realistic appearance
        this.treePositions.forEach(tree => {
            const x = tree.x - (this.environmentOffset * 0.5);
            if (x > -tree.width && x < this.canvas.width + tree.width) {
                this.renderDetailedTree(x, groundLevel, tree);
            }
        });
    }
    
    renderConstructionEquipment(x, groundLevel, equipment) {
        const size = equipment.size;
        
        switch(equipment.type) {
            case 0: // Excavator
                this.ctx.fillStyle = '#ffaa00';
                this.ctx.fillRect(x, groundLevel - size * 0.4, size * 0.8, size * 0.4);
                // Excavator arm
                this.ctx.fillStyle = '#cc8800';
                this.ctx.fillRect(x + size * 0.6, groundLevel - size * 0.6, size * 0.4, size * 0.2);
                break;
            case 1: // Crane
                this.ctx.fillStyle = '#ff6600';
                this.ctx.fillRect(x, groundLevel - size * 0.3, size * 0.6, size * 0.3);
                // Crane boom
                this.ctx.strokeStyle = '#cc4400';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(x + size * 0.3, groundLevel - size * 0.3);
                this.ctx.lineTo(x + size * 1.5, groundLevel - size * 0.8);
                this.ctx.stroke();
                break;
            case 2: // Truck
                this.ctx.fillStyle = '#4444aa';
                this.ctx.fillRect(x, groundLevel - size * 0.3, size, size * 0.3);
                // Wheels
                this.ctx.fillStyle = '#222222';
                this.ctx.beginPath();
                this.ctx.arc(x + size * 0.2, groundLevel, size * 0.1, 0, Math.PI * 2);
                this.ctx.arc(x + size * 0.8, groundLevel, size * 0.1, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 3: // Cement mixer
                this.ctx.fillStyle = '#888888';
                this.ctx.fillRect(x, groundLevel - size * 0.4, size * 0.7, size * 0.4);
                // Mixing drum
                this.ctx.beginPath();
                this.ctx.arc(x + size * 0.35, groundLevel - size * 0.2, size * 0.25, 0, Math.PI * 2);
                this.ctx.fill();
                break;
        }
    }
    
    renderDetailedBuilding(x, groundLevel, building) {
        // Main building structure with depth
        const buildingGradient = this.ctx.createLinearGradient(x, 0, x + building.width, 0);
        buildingGradient.addColorStop(0, '#0a0a0a');
        buildingGradient.addColorStop(0.5, '#1a1a1a');
        buildingGradient.addColorStop(1, '#0a0a0a');
        
        this.ctx.fillStyle = buildingGradient;
        this.ctx.fillRect(x, groundLevel - building.height, building.width, building.height);
        
        // Building edge highlights
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, groundLevel - building.height, building.width, building.height);
        
        // Construction crane on building
        if (building.type === 0) {
            this.ctx.strokeStyle = '#666666';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + building.width * 0.3, groundLevel - building.height);
            this.ctx.lineTo(x + building.width * 0.3, groundLevel - building.height - building.craneHeight);
            this.ctx.moveTo(x + building.width * 0.3, groundLevel - building.height - building.craneHeight * 0.8);
            this.ctx.lineTo(x + building.width * 0.8, groundLevel - building.height - building.craneHeight * 0.8);
            this.ctx.stroke();
        }
        
        // Enhanced windows with different patterns
        const windowColors = ['#444422', '#664422', '#442244', '#224444'];
        this.ctx.fillStyle = windowColors[building.windowPattern];
        
        for (let w = 8; w < building.width - 8; w += 18) {
            for (let h = 25; h < building.height - 15; h += 30) {
                if (Math.random() > 0.4) {
                    // Window frame
                    this.ctx.fillStyle = '#333333';
                    this.ctx.fillRect(x + w, groundLevel - building.height + h, 12, 18);
                    
                    // Window glass with reflection
                    this.ctx.fillStyle = windowColors[building.windowPattern];
                    this.ctx.fillRect(x + w + 1, groundLevel - building.height + h + 1, 10, 16);
                    
                    // Window reflection
                    if (Math.random() > 0.7) {
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        this.ctx.fillRect(x + w + 1, groundLevel - building.height + h + 1, 4, 8);
                    }
                }
            }
        }
        
        // Rooftop details
        if (building.type === 1) {
            // Air conditioning units
            this.ctx.fillStyle = '#666666';
            this.ctx.fillRect(x + 10, groundLevel - building.height - 8, 20, 8);
            this.ctx.fillRect(x + building.width - 30, groundLevel - building.height - 6, 15, 6);
        }
    }
    
    renderDetailedTree(x, groundLevel, tree) {
        // Enhanced tree trunk with texture
        const trunkWidth = tree.width * 0.25;
        const trunkHeight = tree.height * 0.4;
        
        // Trunk gradient for depth
        const trunkGradient = this.ctx.createLinearGradient(x, 0, x + trunkWidth, 0);
        trunkGradient.addColorStop(0, '#2d1810');
        trunkGradient.addColorStop(0.5, '#4a2818');
        trunkGradient.addColorStop(1, '#2d1810');
        
        this.ctx.fillStyle = trunkGradient;
        this.ctx.fillRect(x, groundLevel - trunkHeight, trunkWidth, trunkHeight);
        
        // Trunk texture lines
        this.ctx.strokeStyle = '#1a0f08';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < trunkHeight; i += 8) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, groundLevel - i);
            this.ctx.lineTo(x + trunkWidth, groundLevel - i);
            this.ctx.stroke();
        }
        
        // Multi-layer foliage for depth
        const foliageX = x + trunkWidth * 0.5;
        const foliageY = groundLevel - tree.height * 0.6;
        
        // Back layer (darker)
        this.ctx.fillStyle = '#0f2a0f';
        this.ctx.beginPath();
        this.ctx.arc(foliageX + 5, foliageY + 5, tree.width * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Middle layer
        this.ctx.fillStyle = '#1a3d1a';
        this.ctx.beginPath();
        this.ctx.arc(foliageX, foliageY, tree.width * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Front layer (lighter)
        this.ctx.fillStyle = '#2d5a2d';
        this.ctx.beginPath();
        this.ctx.arc(foliageX - 3, foliageY - 3, tree.width * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Tree branches
        this.ctx.strokeStyle = '#2d1810';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(foliageX, foliageY);
        this.ctx.lineTo(foliageX - 15, foliageY - 10);
        this.ctx.moveTo(foliageX, foliageY);
        this.ctx.lineTo(foliageX + 12, foliageY - 8);
        this.ctx.stroke();
    }
    
    renderMonster() {
        if (this.monsterDistance >= 100) return;
        
        const groundLevel = this.canvas.height * 0.7;
        const monsterProgress = 1 - (this.monsterDistance / 100);
        const monsterSize = 60 + (monsterProgress * 250); // Gets bigger as it approaches
        const monsterX = this.canvas.width / 2;
        const monsterY = groundLevel - monsterSize * 0.8;
        
        // Monster aura/darkness effect
        if (this.monsterDistance < 70) {
            const auraRadius = monsterSize * 1.5;
            const auraGradient = this.ctx.createRadialGradient(
                monsterX, monsterY, 0,
                monsterX, monsterY, auraRadius
            );
            auraGradient.addColorStop(0, `rgba(20, 0, 0, ${0.2 + monsterProgress * 0.3})`);
            auraGradient.addColorStop(1, 'rgba(20, 0, 0, 0)');
            
            this.ctx.fillStyle = auraGradient;
            this.ctx.fillRect(monsterX - auraRadius, monsterY - auraRadius, 
                            auraRadius * 2, auraRadius * 2);
        }
        
        // Shadow on ground
        const shadowWidth = monsterSize * 0.8;
        const shadowGradient = this.ctx.createRadialGradient(
            monsterX, groundLevel, 0,
            monsterX, groundLevel, shadowWidth
        );
        shadowGradient.addColorStop(0, `rgba(0, 0, 0, ${0.4 + monsterProgress * 0.4})`);
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = shadowGradient;
        this.ctx.fillRect(monsterX - shadowWidth, groundLevel - 5, 
                        shadowWidth * 2, 10);
        
        // Monster main body with more detail
        const bodyOpacity = 0.4 + monsterProgress * 0.6;
        this.ctx.fillStyle = `rgba(5, 5, 5, ${bodyOpacity})`;
        
        // Main torso (irregular shape)
        this.ctx.beginPath();
        this.ctx.ellipse(monsterX, monsterY, monsterSize * 0.35, monsterSize * 0.7, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Hunched shoulders
        this.ctx.beginPath();
        this.ctx.ellipse(monsterX - monsterSize * 0.25, monsterY - monsterSize * 0.4, 
                        monsterSize * 0.2, monsterSize * 0.3, -0.3, 0, Math.PI * 2);
        this.ctx.ellipse(monsterX + monsterSize * 0.25, monsterY - monsterSize * 0.4, 
                        monsterSize * 0.2, monsterSize * 0.3, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Elongated arms with claws
        const armSway = Math.sin(this.survivalTime * 0.004) * 15;
        const armReach = Math.sin(this.survivalTime * 0.002) * 20;
        
        // Left arm
        this.ctx.fillStyle = `rgba(8, 8, 8, ${bodyOpacity})`;
        this.ctx.beginPath();
        this.ctx.ellipse(monsterX - monsterSize * 0.6 + armSway, 
                        monsterY + monsterSize * 0.1 + armReach, 
                        monsterSize * 0.15, monsterSize * 0.6, -0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right arm
        this.ctx.beginPath();
        this.ctx.ellipse(monsterX + monsterSize * 0.6 - armSway, 
                        monsterY + monsterSize * 0.1 - armReach, 
                        monsterSize * 0.15, monsterSize * 0.6, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Claws at end of arms
        if (this.monsterDistance < 60) {
            this.ctx.fillStyle = `rgba(40, 40, 40, ${bodyOpacity + 0.2})`;
            
            // Left claws
            for (let i = 0; i < 4; i++) {
                const clawX = monsterX - monsterSize * 0.6 + armSway + (i - 2) * 3;
                const clawY = monsterY + monsterSize * 0.7 + armReach;
                this.ctx.fillRect(clawX, clawY, 2, monsterSize * 0.15);
            }
            
            // Right claws
            for (let i = 0; i < 4; i++) {
                const clawX = monsterX + monsterSize * 0.6 - armSway + (i - 2) * 3;
                const clawY = monsterY + monsterSize * 0.7 - armReach;
                this.ctx.fillRect(clawX, clawY, 2, monsterSize * 0.15);
            }
        }
        
        // Legs (partially visible)
        this.ctx.fillStyle = `rgba(10, 10, 10, ${bodyOpacity})`;
        this.ctx.fillRect(monsterX - monsterSize * 0.15, monsterY + monsterSize * 0.5, 
                         monsterSize * 0.12, monsterSize * 0.4);
        this.ctx.fillRect(monsterX + monsterSize * 0.03, monsterY + monsterSize * 0.5, 
                         monsterSize * 0.12, monsterSize * 0.4);
        
        // Head/face area
        if (this.monsterDistance < 80) {
            this.ctx.fillStyle = `rgba(3, 3, 3, ${bodyOpacity + 0.1})`;
            this.ctx.beginPath();
            this.ctx.ellipse(monsterX, monsterY - monsterSize * 0.5, 
                           monsterSize * 0.25, monsterSize * 0.3, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Glowing red eyes with intensity based on distance
        if (this.monsterDistance < 70) {
            const eyeIntensity = (70 - this.monsterDistance) / 70;
            const eyeSize = 4 + monsterProgress * 8;
            const eyeGlow = 3 + monsterProgress * 6;
            
            // Eye glow effect
            const eyeGlowGradient = this.ctx.createRadialGradient(
                monsterX - monsterSize * 0.12, monsterY - monsterSize * 0.5, 0,
                monsterX - monsterSize * 0.12, monsterY - monsterSize * 0.5, eyeGlow * 2
            );
            eyeGlowGradient.addColorStop(0, `rgba(255, 0, 0, ${eyeIntensity * 0.8})`);
            eyeGlowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            this.ctx.fillStyle = eyeGlowGradient;
            this.ctx.fillRect(monsterX - monsterSize * 0.12 - eyeGlow * 2, 
                            monsterY - monsterSize * 0.5 - eyeGlow * 2,
                            eyeGlow * 4, eyeGlow * 4);
            this.ctx.fillRect(monsterX + monsterSize * 0.12 - eyeGlow * 2, 
                            monsterY - monsterSize * 0.5 - eyeGlow * 2,
                            eyeGlow * 4, eyeGlow * 4);
            
            // Actual eyes
            this.ctx.fillStyle = `rgba(255, 20, 20, ${eyeIntensity})`;
            this.ctx.beginPath();
            this.ctx.arc(monsterX - monsterSize * 0.12, monsterY - monsterSize * 0.5, eyeSize, 0, Math.PI * 2);
            this.ctx.arc(monsterX + monsterSize * 0.12, monsterY - monsterSize * 0.5, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Eye pupils
            this.ctx.fillStyle = `rgba(100, 0, 0, ${eyeIntensity})`;
            this.ctx.beginPath();
            this.ctx.arc(monsterX - monsterSize * 0.12, monsterY - monsterSize * 0.5, eyeSize * 0.4, 0, Math.PI * 2);
            this.ctx.arc(monsterX + monsterSize * 0.12, monsterY - monsterSize * 0.5, eyeSize * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Menacing mouth/teeth when very close
        if (this.monsterDistance < 30) {
            this.ctx.fillStyle = `rgba(50, 0, 0, ${monsterProgress})`;
            this.ctx.fillRect(monsterX - monsterSize * 0.1, monsterY - monsterSize * 0.35, 
                            monsterSize * 0.2, monsterSize * 0.08);
            
            // Teeth
            this.ctx.fillStyle = `rgba(200, 200, 180, ${monsterProgress})`;
            for (let i = 0; i < 6; i++) {
                const toothX = monsterX - monsterSize * 0.08 + (i * monsterSize * 0.03);
                this.ctx.fillRect(toothX, monsterY - monsterSize * 0.35, 2, monsterSize * 0.05);
            }
        }
        
        // Particle effects around monster when close
        if (this.monsterDistance < 40) {
            for (let i = 0; i < 8; i++) {
                const particleX = monsterX + (Math.sin(this.survivalTime * 0.01 + i) * monsterSize * 0.6);
                const particleY = monsterY + (Math.cos(this.survivalTime * 0.008 + i) * monsterSize * 0.4);
                const particleOpacity = Math.sin(this.survivalTime * 0.02 + i) * 0.3 + 0.2;
                
                this.ctx.fillStyle = `rgba(100, 0, 0, ${particleOpacity * monsterProgress})`;
                this.ctx.beginPath();
                this.ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
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