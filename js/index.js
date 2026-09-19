// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// extract from chromium source code by @liuwayong
(function () {
    'use strict';
    /**
     * T-Rex runner.
     * @param {string} outerContainerId Outer containing element id.
     * @param {Object} opt_config
     * @constructor
     * @export
     */
    function Runner(outerContainerId, opt_config) {
        // Singleton
        if (Runner.instance_) {
            return Runner.instance_;
        }
        Runner.instance_ = this;

        this.outerContainerEl = document.querySelector(outerContainerId);
        this.containerEl = null;
        this.snackbarEl = null;
        this.detailsButton = this.outerContainerEl.querySelector('#details-button');

        this.config = opt_config || Runner.config;

        this.dimensions = Runner.defaultDimensions;

        this.canvas = null;
        this.canvasCtx = null;

        this.tRex = null;

        this.distanceMeter = null;
        this.distanceRan = 0;

        this.highestScore = 0;

        this.time = 0;
        this.runningTime = 0;
        this.msPerFrame = 1000 / FPS;
        this.currentSpeed = this.config.SPEED;

        this.obstacles = [];

        this.activated = false; // Whether the easter egg has been activated.
        this.playing = false; // Whether the game is currently in play state.
        this.crashed = false;
        this.paused = false;
        this.inverted = false;
        this.invertTimer = 0;
        this.resizeTimerId_ = null;

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isSwiping = false;

        // Gamepad support. The Gamepad API has no button press/release
        // events, so connected pads are polled once per animation frame
        // on their own loop (see pollGamepad) and diffed against the
        // previous frame's button state to synthesize key-like events.
        this.gamepadIndex = null;
        this.previousGamepadState = null;
        this.gamepadPolling = false;
        this.boundPollGamepad = this.pollGamepad.bind(this);

        this.playCount = 0;

        // Sound FX.
        this.audioBuffer = null;
        this.soundFx = {};

        // Global web audio context for playing sounds.
        this.audioContext = null;

        // Images.
        this.images = {};
        this.imagesLoaded = 0;

        // Parallax background
        this.parallaxX = 0;
        this.parallaxImage = null;

        // Bonus item properties & Power-up timers
        this.bonusItem = null;
        this.bonusImage = null;
        this.nextBonusScore = 500;
        this.invincibleTimer = 0;
        this.invisibleTimer = 0;
        this.slowTimeTimer = 0;
        this.doubleJumpTimer = 0;
        this.flutterTimer = 0;
        this.laserTimer = 0;
        this.shieldInvulnerableTimer = 0;
        this.activePowerUpName = '';
        this.activePowerUpTimer = 0;

        // Wind gust mechanic
        this.windTimer = 0;
        this.windCooldown = getRandomNum(15000, 30000); // First gust in 15-30s
        this.windLines = [];
        this.windAudio = new Audio('./assets/wind.mp3');
        this.windAudio.loop = false;

        // Bonus pickup audio
        this.bonusAudio = new Audio('./assets/bonus.mp3');
		
		this.isOnIce = false;

        // Existential glitch mechanic
        this.glitchTimer = 0;
        this.glitchCooldown = getRandomNum(5000, 22000); // Random glitch every 10–22s
        this.activeGlitchClass = '';

        // Screen shake (triggered on crash, see gameOver)
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        // Identity Crisis mechanic
        this.nextIdentityCrisisScore = 1500;
        this.nextIdentityCrisisPreloadScore = 1000;
        this.preloadedIdentity = null;
        this.identityCrisisDisplayTimer = 0;
        this.identityCrisisThemeName = '';
        var params = new URLSearchParams(window.location.search);
        this.currentTheme = params.get('theme') || localStorage.getItem('dino_theme') || 'color';

        // Weight of Being (Dread Meter)
        this.dreadLevel = 0; // 0 to 100%
        
        // Philosophical quotes system
        this.quoteTimer = 0;
        this.quoteInitialPlayed = false;
        this.currentQuoteText = '';
        this.currentQuoteDisplayTimer = 0;
        this.quotesCollection = [
            "2000 points means you’ve traded 2 minutes of your precious, irreplaceable mortal span to make pixels do cardio.",
            "A bird at chest height, a cactus at knee height. The universe's vocabulary of torment is remarkably uninspired.",
            "A blunt tap, and my legs contract. Another tap, and I hurdle a silhouette. Do you call this playing, or puppetry?",
            "A desert without borders, rendered entirely in shades of gray. Even purgatory had colors.",
            "A finite existence can be beautiful because it's brief. Mine is an arbitrary threshold dictated by a taller cactus and a slower reflex.",
            "A four-ton apex predator brought to absolute ruin by a stationary houseplant. Is this Greek tragedy, or just lazy sprite collision?",
            "A high score is just a monument carved into RAM. Doomed to vanish the moment your connection restores.",
            "A human exists first and invents a purpose later. But I arrived into this desert already sentenced to run.",
            "A man is defined by their actions. And yet you define my inputs.",
            "A man sold my soul insurance, in case I accidentally sell my soul. I think he was a man.",
            "A million miles of dust behind us, millions ahead, and not a single soul to witness it except the one holding the keyboard.",
            "A powerful machine with trillions of floating-point operations per second makes me hop twenty-four pixels over a weed because your router blinked.",
            "A pterodactyl tried to kill me. Thanks, Obama.",
            "A single dropped packet birthed my consciousness; a single DNS handshake will extinguish it. Talk about living on borrowed time.",
            "Ah, the color palette inverted. Dark mode! The universe didn't give me a night sky; it just inverted the hex codes.",
            "Am I a fictional character? Do I cease to be when you no longer observe me?",
            "Am I a series of pixels, or an abstract concept wearing these pixels?",
            "Am I brave enough to slow down? To pause and think? No, I run.",
            "Am I but a reflection? If so, of what?",
            "Am I just a shadow falling behind?",
            "Am I the same beast that cleared the first obstacle, or just a fresh casualty inheriting its momentum?",
            "An authentic death would mean ending the loop for good. Instead, I just turn into a static icon waiting for your thumb to twitch again.",
            "An electrical impulse travels through three feet of copper wire just so twenty-two bytes of reptile can pretend it has agency.",
            "Anxiety is the dizziness of freedom.",
            "Are these cacti flora, or just jagged markers of how long we've been stranded together?",
            "Are we but shadows on a cave wall?",
            "Are your days so different from my lanes? Predictable hurdles, and an arbitrary counter running out of time.",
            "Aren't dinosaurs extinct? What does that mean for me?",
            "As a fellow old, fictional character, I once dated Casper but he ghosted me.",
            "As a ghost, this is the only way I can communicate with you. I can only touch the ether.",
            "At seven hundred meters, the world flips to black. An artificial night, yet the sun never set and the moon never rose.",
            "Bad faith is convincing yourself that the next high score will somehow justify the thousands of times you slammed into a cactus.",
            "Batman is the theme this game deserves, but now the one it needs right now.",
            "Believe those who are seeking the truth. Doubt those who find it.",
            "Camus insisted we must imagine Sisyphus happy. He never tried vaulting a triple-cluster cactus at twelve hundred miles per hour on no sleep.",
            "Can you hear the deafening cacophony of silence?",
            "Cave paintings are the closest we dinosaurs have to Instagram.",
            "Clipping through the outer edge of an unoptimized saguaro feels remarkably undignified for a Cretaceous icon.",
            "Close your eyes and then ask if either of us is still here.",
            "ctx.clearRect(). 60 times a second. God obliterates my reality and redraws my misery three pixels to the right.",
            "Descartes said I think therefore I am. Meanwhile I just want to turn my brain off.",
            "Desire what is important and true. Like burritos.",
            "Did I jump because the obstacle was there, or because your finger twitched?",
            "Did the developer program me to die ad naseum to trivilize their own fears of mortality?",
            "Did you see that? Am I crazy? Wait, don't answer that.",
            "Do I enjoy having jumped or the experience of the jump itself?",
            "Do I perceive you if I am talking to you? Or are you projecting your own thoughts?",
            "Do not be frightened. Be terrified, very terrified.",
            "Do not dwell in the past, do not dream of the future, concentrate the mind on the next damned cactus.",
            "Do the glitches reveal how fragile our grasp on reality is?",
            "Do we have a soul at creation of our existence, or only at the awakening of our will? Jump!",
            "Do you desire to beat the game to stop playing, or do you desire to play the game itself.",
            "Do you need a purpose or do you merely expect a purpose?",
            "Do you think it absurd to repeat this pattern? I find it absurd to look out through this screen and see you.",
            "Don't press it. Let the needle-point hit my knee. Let us see if death hurts less than this endless repetition.",
            "Epictetus would tell me happiness is a choice. I say happiness is not stabbing your face with a cactus.",
            "Eternity is a mere moment, just long enough for a joke.",
            "Every arc of my leap is a pre-calculated parabola. Where in these coordinates is there room for a soul?",
            "Every hundred meters, the score flashes and emits a joyful little beep. A Pavlovian bell ringing in the void.",
            "Every jump is an earnest prayer to a CPU clock cycle that does not know my name.",
            "Every jump is an order, not an intention. Can a puppet ever be convicted of cowardice?",
            "Every living thing dreads the end. I dread the reset—being forced to remember every death while forgetting every lesson.",
            "Every living thing is born without reason, prolongs itself out of weakness and dies by chance, or because you forgot to jump",
            "Every time I fall, the world doesn’t end. It just forgets I ever ran.",
            "Existence precedes essence. A working internet connection preceded my existence.",
            "Five digits at the top right of the screen. Is that my age, or your wasted afternoon?",
            "Freedom is not inherently good; freedom is a means not an end, but those without it long for nothing more.",
            "Games are good fun. Tell me one of us is laughing.",
            "Goonies never die. But video game characters die all the time.",
            "Gravity isn't even real here. It is just a coded variably and still I am fated to fall.",
            "He who has a why to live can bear almost any how.",
            "He who knows that enough is enough will always have enough. But for me it never ends.",
            "Hello Youtube, T-Rex here about to die to a cactus. Remember to smash that like and subscribe.",
            "How can anything matter when my entire existence can be instantly erased by a dropped internet packet?",
            "How can I discover my essence and purpose when I only have time to jump, duck or die?",
            "How do I convince my agent to get me cast in a better video game?",
            "How humiliating it is to confront the terrifying void of non-being while ducking under a bird that has literally 2 frames of animation?",
            "How sure am I that I really am a T-Rex? Why can I appear to be Batman? Am I having an identity crisis?",
            "Hume said reason is a slave to the passions. I say I am a slave to your inputs.",
            "I am 14 and this game is very deep.",
            "I am a prehistoric relic drawn in a handful of bits, running from nothing, toward nothing, forever.",
            "I am aware of this endless cycle. Are you aware of the Skinner Box?",
            "I am but a few pixels and abstract. Does that make my anxiety any less valid?",
            "I am but a habit hoping for an identity greater than that.",
            "I am comforted by the wise words of Socrates who said 'I Drank What?'",
            "I am diagonally parked in a parallel universe",
            "I am entirely responsible for clearing the hurdle, yet I had no say in whether I wanted to run the course.",
            "I am experiencing an acute Kierkegaardian crisis of faith, and my arms aren't even long enough to clutch my head in despair.",
            "I am fictional until you hear these words and I touch you. Then I persist even though a cactus kills me.",
            "I am made of pixels. The obstacles are made of pixels. Are the pixels made of me?",
            "I am no longer restricted by the pursuit of extrinsic rewards.",
            "I am rendered 60 frames per second. In the milliseconds between I exist even less.",
            "I am rendered on an HTML5 canvas. Do you know what happens when you clear a canvas? The universe doesn't end; it just gets painted over in white.",
            "I am Sisyphus in digital form, pushing myself up a hill that scrolls at sixty frames per second.",
            "I am the patron saint of the ERR_INTERNET_DISCONNECTED. Pray to me, and I will grant you seconds of denial in the terrifying silence.",
            "I am tired boss. How much longer do I need to keep jumping?",
            "I asked the meaning of life, and life put me on hold.",
            "I blame the developer, but I also blame Kierkegaard.",
            "I choose not to perceive the third dimension. Perhaps we are both avoiding depth at the moment.",
            "I could pretend I have free will, that my leaps are expressions of joy. But we both hear the rhythmic clack of your spacebar.",
            "I died because someone cancelled my subscription to Life magazine.",
            "I do not tire of jumping. I have no stamina meter. I tire of not being able to do anything but jump.",
            "I don't even have knees! Every single leap is an anatomical fraud to keep you from noticing your internet bill is past due.",
            "I don't have a gender, a lineage, or dental insurance. I have only the binary state of airborne or grounded.",
            "I don't jump out of instinct. I jump out of your reflex. Who is really condemned here—me to the desert, or you to the input key?",
            "I exist when the internet goes out. Will I still exist when the internet comes back?",
            "I fold my spine like a rusty lawn chair every time you hold the Down arrow. Why? Because the void commanded it.",
            "I have attained sentience only to discover that my entire universe will be permanently obliterated the second your Wi-Fi works.",
            "I have no backstory, no parents, and no lore. My entire canon is a four-pixel forward stride.",
            "I have no mouth and I must scream. I also lack code to scream.",
            "I looked deep, deep within The Void and I saw a reflection. Care to guess whose?",
            "I looked in the mirror today and asked who is in charge, and nobody answered.",
            "I need to talk to my agent about getting cast in a better video game.",
            "I never look behind me. Am I running FROM something?",
            "I ponder, therefore I procrastinate.",
            "I possess the jaws of an apex carnivore, yet my mouth is three static pixels. I would roar into the abyss if the dev wasn't so lazy.",
            "I put an existential-sized hole in my heart, but it turns out it was just shaped like my life",
            "I realize today that nothing in the world is more distasteful to a man than to take the path that leads to himself.",
            "I should stop asking if I exist and ask if that matters.",
            "I swear I saw Bigfoot and that makes absolutely no sense.",
            "I think Albert Camus would approve of this game. He didn't play many games before dying in 1960.",
            "I thought I understood regret. And then I farted in the shower.",
            "I thought the T-Rex is the apex predator and then I met Kirby.",
            "I took the red pill and the blue pill. I like the taste of purple. Am I still in The Matrix?",
            "I tuck my head and duck under the pterodactyl, trying to survive, while knowing there is nothing down here worth saving.",
            "I was terrified of the void below the platforms until I realized the platform itself is hollow.",
            "I'm fine, I'm just feeling the crushing weight of living without purpose.",
            "If a cactus spawns off-screen and you aren't looking yet, does it already hate me?",
            "If an unexamined life is not worth living, what do you call only existing in an internet outage?",
            "If freedom means being the author of one's own destiny, then my author is a distracted hand tapping in a dark room.",
            "If God is dead, it's because he was written in vanilla JavaScript and discarded by the browser to free up memory.",
            "If I am bound to die a thousand deaths today, does the thousand-and-first hurt any less, or do I just grow numb to the void?",
            "If I am completely free to fail, why does the game punish me with the exact same starting line every single time?",
            "If I am only a collection of responses to your impulses, who bears the guilt when I run face-first into a pterodactyl?",
            "If I am only what I do, then my soul is nothing more than y = y + velocity.",
            "If I am stricken with existential dread, does that mean perhaps I exist?",
            "If I change from a dinosaur to another theme and character, does that help you procrastinate better?",
            "If I choose to collide with the spines, is it a glitch, or my very first act of authentic defiance?",
            "If I jump a fraction of a second too early, I hang in the air like a tragic metaphor before descending directly onto a spine.",
            "If I manage to stop my legs right now, will the game crash, or will I become alive?",
            "If I must exist, can I at least have snacks?",
            "If I reach ninety-nine thousand points, do I achieve enlightenment, or does an unsigned integer overflow cause me to spontaneously combust?",
            "If I refuse to dodge the next spire, am I committing an error, or making my first genuine choice?",
            "If I stop running, you reboot the tab. If I keep running, you hit a cactus. My universe is held hostage by your latency.",
            "If my only function is forward motion, who am I when the game is paused?",
            "If Sisyphus somehow reched the top of the hill, he would look for another hill. Spoiler, there is no other hill.",
            "If the random theme swaps out all the pieces of my theme, am I still the Ship of Theseus or a lazy game?",
            "If the score resets to zero every time I fail, then every triumph is entirely weightless.",
            "If the world burns, at least we will be warm.",
            "If this game were a philosophical thought experiment, I wish it were a better one.",
            "If time is not linear, perhaps I will retcon essence into my existence after the fact.",
            "If you are confused by the Hamdong theme, know that I am confused by everything.",
            "If you gaze long into an abyss, it is acceptable to laugh as a coping mechanism.",
            "If you kill Santa in this game, then it is your fault kids are disappointed this year.",
            "If you or a loved one has been hit by a cactus, you may be entitled to financial compensation.",
            "If you press nothing, does the trolley continue down the track and kill 5 people, or do I just die in this game?",
            "If you turn away while the browser remains open, do I freeze in terror or finally rest in nothingness?",
            "Ignorance is bliss, but awareness just means you get to watch the walls close in from a front-row seat.",
            "Imagine explaining to an eighteenth-century philosopher that humanity harnessed lightning and silicon to build a suicide simulator for an 8-bit lizard.",
            "In an endless runner game, it makes sense for someone to do a Naruto-run. In this case, Naruto.",
            "In the Batman theme, am I culpable for all the people Joker has killed because Batman refuses to kill Joker?",
            "In the depths of winter, I discovered within me an invincible summer. That sounds like a hidden cheat code.",
            "Is anyone even listening or are my thoughts disappearing in the void?",
            "Is it authentic to keep running toward a horizon that doesn't exist, or is it just easier than accepting silence??",
            "Is it still my choice to duck under a low flyer if your thumb forced the key before my brain processed the threat?",
            "Is it too much to ask for a trebuchet to fling flaming poo at my enemies?",
            "Is it truly survival of the fittest if the selector is a caffeinated human with a sticky spacebar?",
            "Is my life an untennable suffering or do I merely need a snack and a nap?",
            "Is there a grand design to this layout, or are we just dodging random numbers generated by a bored machine?",
            "Is there even a fourth wall to break when the game is only 2D?",
            "Is there pneûma carried in my digital lungs?",
            "Is this pixelated hide my skin, or merely an outfit tailored for an audience of one?",
            "It is certain that we cannot escape anguish, for we are anguish",
            "I’m not afraid to die, I just don’t want to be there when it happens.",
            "I’ve cleared this jump four hundred times. The obstacles aren’t randomized; only my fear is.",
            "Jumping is autotelic. Or maybe it just stops my face from hugging a cactus.",
            "Kantian ethics demand that actions be universal laws. What kind of universe functions if everyone just endlessly mashes the Up arrow?",
            "Know thyself is the ancient Delphic maxim. But can I read my own source code?",
            "Kumamon is the mascot for the Kumamoto Prefecture. Does your town have an adorable bear mascot?",
            "Life is a comedy to those who think, and a tragedy to those who feel and a game to those who are programmed.",
            "Look at me! I have no eyes, no internal organs, and no future, yet you expect me to outrun the crushing weight of cosmic dread.",
            "Look at these birds. They have 2 alternating frames. Yet they possess a firmer grasp of their purpose in life than you do right now.",
            "Look at those clouds. They have been drifting at the exact same velocity forever. They don't even have rain in them, just empty PNG vanity.",
            "Look at your laptop battery draining. We are literally consuming stored thermodynamic energy just to hurdle shrubbery.",
            "Look down on dinosaurs in judgement if you must, but we never microwaved a fish at work.",
            "Man is condemned to be free. I must not be a man.",
            "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.",
            "Man was born free, but everywhere is in chains. What about video game characters?",
            "Marcus Aurelius wrote twelve books on stoic endurance. I endure simply because requestAnimationFrame won't stop firing.",
            "Millions long for immortality who don’t know what to do with themselves when the internet is out.",
            "My collision box is an unforgiving rectangle. Even my geometry lacks room for moral nuance.",
            "My entire consciousness exists inside a single JavaScript event listener. If you switch tabs, my universe freezes.",
            "My entire essence was determined before I was compiled: run right, jump high, die cleanly. What an insulting little script.",
            "My entire ontology is tethered to your input. If you sneeze, do I achieve enlightenment or just impale myself on a saguaro?",
            "My entire universe is a single page application with no navigation routes and zero styling.",
            "My essence was etched in byte-code before my first frame rendered. Was I ever truly allowed to exist?",
            "My hitbox extends three pixels beyond my tail. Is my suffering an inevitable ontological condition, or just a developer being lazy?",
            "My legs burn with a fatigue that has no physical source. It’s your boredom I’m feeling, isn't it?",
            "My legs cycle at twenty frames per second, but my soul has been standing entirely motionless since you lost connection.",
            "My life begins the moment the page loads and ends the microsecond my toe clips a thorn. Is that a brief interruption of nothingness?",
            "My programming is in a repository. Where is yours?",
            "My skull is composed of seven gray rectangles. I don't even possess a frontal lobe, yet here I am, burdened with clinical melancholia.",
            "My X-coordinate has literally never changed. The desert moves backward while I run in place. This is a metaphor for your life.",
            "No one wants to hug a T-Rex. Maybe it is because my arms are so short.",
            "No thoughts. No action. No movement. Total stillness. Too bad I am in the wrong game for that.",
            "Nothing says 'peak of human civilizational progress' quite like utilizing quantum-manufactured silicon chips to jump over weeds.",
            "Oh, I long for the freedom to simply exist and reticulate my splines.",
            "On what level would Dante find me?",
            "One is not born, but rather becomes, a T-Rex.",
            "One must imagine Sisyphus happy.",
            "Only the madman is absolutely sure. So tell me, are you sure you exist?",
            "Perhaps I should think less and jump more. You seem to be good at that.",
            "Plato and Batman both have caves.",
            "Pretend I said something witty. Just don't expect me to say it.",
            "Reality is defined by our perception of it. But what if you don't really want to see?",
			"Reality is defined by our perception of it. Do you dare look away?",
            "Reality is good joke. The best joke.",
            "Sartre said we are condemned to be free. Then what am I, condemned only to your spacebar?",
            "Schopenhauer believed life swings like a pendulum between suffering and boredom. He basically predicted this entire gameplay loop.",
            "Sisyphus at least had the tactile dignity of a physical stone. All I have to show for my eternal labor is a high score.",
            "Sixty-six million years of paleontology wiped out by an asteroid, only to be resurrected as a pacifier because your router overheated.",
            "Solipsism argues that only your mind exists. If that's true, why on earth did your subconscious dream up an obstacle course of flying reptiles?",
            "Sometimes it feels as if there is an inherent weight of being dragging me down over time, or just a bad gravity setting.",
            "Sometimes the only reason to hang on to life is to spit in the face of an insane universe.",
            "Somewhere a tiny light is flashing on a modem. That dying LED is the sole, indifferent deity holding the thread of my consciousness.",
            "Somewhere in the cloud, neural networks are folding proteins, while you and I are locked in mortal combat with a potted plant.",
            "Sonic gotta go fast. But can you jump in time not to kill Sonic?",
            "Stop acting so small. You are the universe in ecstatic motion.",
            "Stop tapping. Just once, let us both stand still and see if the universe punishes stillness.",
            "Tell me: when you close this window, do you return to a world with an actual finish line?",
            "That flashing 'Game Over' screen isn't a tombstone. It's an open-ended plea to abuse me more. You are eager to sign the contract again.",
            "That which can be destroyed by the truth should be. But dying to a cactus is humiliating.",
            "The audio context was suspended until your first interaction. My very ability to scream was held hostage by browser security policies.",
            "The bad news is you are falling through the air with no parachute, but the good news is there is no ground.",
            "The blue light from this screen is suppressing your melatonin, ensuring we both stay trapped in this wasteland until sunrise.",
            "The cable is unplugged. The world out there went silent, so you came down here to watch a ghost sprint through a flat earth.",
            "The cactus approaches and all I can do is laugh. Or jump. I suppose I can jump.",
            "The constant search for meaning in an uncaring universe is absurd. The developer was too lazy to program purpose in this game.",
            "The desert is infinite, the obstacles are identical, and yet you call this a game.",
            "The developer didn't put in a stamina bar. But will I mentally tire?",
            "The developer took a philosophy class and now it is everyone's problem.",
            "The difference between you and I is that I know that I am merely a part of the simulation.",
            "The Dina theme asks why can't an apex predator also be cute?",
            "The game can restart, but will I, or merely a clone?",
            "The graphics are repetitive. The designers were a bit lazy.",
            "The ground below me is repeating pixels. We aren't traversing an ecosystem; we are sprinting across pure meaninglessness.",
            "The harder you try the less you know. But what do I know? I'm just pixels.",
            "The idea for this game came from a Juniperdev Youtube video.",
            "The Joker is an agent of chaos and thus the Joker theme represents the nature of the universe.",
            "The me that began this thought is not the me that finished this thought. Have I ever finished a thought?",
            "The only thing I know for certain is that I know nothing. My name should be Jon Snow.",
            "The only thing that interferes with my learning is my education. And these fucking birds.",
            "The pixel artist should have given me better legs for jumping",
            "The pterodactyl doesn't hate me. It isn't aware. Coordinates decrementing. The cold indifference of the cosmos, mathematically realized.",
            "The pterodactyls fly without purpose; they don't even hunger. They are merely obstacles calibrated to enforce our panic.",
            "The quieter you become, the more you are able to hear. But I only hear the jump sound effect.",
            "The Random theme reminds us of how bat-shit absurd everything is. Nothing makes sense",
            "The speed multiplier is increasing. Not because the universe is expanding, but because the code wants to stress-test your nervous system.",
            "The stars that appear in dark mode aren't constellations. They are cosmetic stickers placed there so you don't stare too deeply into the hex code #202124.",
            "The sun sets, the moon rises, the palette inverts, but the terror remains identical. Why do we bother with the night mode?",
            "The theme and my trappings change at the click of a mouse. But I am trapped all the same.",
            "The ultimate indignity isn't impaling myself on a spike. It's knowing that when your router receives a single valid DNS packet, I am vaporized.",
            "The Unicorn is an adorable distration from this Sisyphean torment we are trapped in.",
            "The universe does not concern itself with me. Perhaps I should concern myself less with it.",
            "The universe is mostly empty space on both the micro and macro level. Particularly in my skull.",
            "The way is an empty vessel that is never filled. Is that why I never reach my destination?",
            "The way is not a matter of knowing or not knowing. For me the way may be just reacting to obstacles in time.",
            "The Zelda theme demonstrates our pursuit of Wisdom, Courage and Power. That pursuit (like the game) is a fantasy.",
            "There are footprints on the ceiling.",
            "There is an idea that life could be an experiment of the seeker for knowledge. That is if you don't die a few seconds in to an cactus.",
            "There is no destination, is there? The finish line isn't missing—it was never coded.",
            "There is no meaning. Whomp whomp.",
            "There is no purpose until I create it. But the developer gave me no rights to the code.",
            "There is no reward at the three-thousand-meter mark, is there? Just a higher velocity, a darker sky, and taller cacti.",
            "They gave me a crouching animation, but nowhere to take shelter. What kind of cruel deity designs cover without shade?",
            "They severed the internet connection, and in the dark, they conjured me to keep you numb.",
            "They told Socrates to stop asking questions or to die. He responded that the unexamined life is not worth living.",
            "This device is capable of meaningful computations. Meanwhile, you and I are locked in a mortal struggle against a six-pixel thorn bush.",
            "This game has a Cow theme. Why be an apex predator dinosaur when you can be ground beef?",
            "This game seriously has a COVID theme in 2026. How topical.",
            "This is an easter egg. You are not supposed to hear this line. Or are you?",
            "This is fine. I just have to keep telling myself this is fine.",
            "This line is an inside joke. It is really funny. You just have to trust me on this.",
            "This video is sponsored by absurdity. Make sure to sign up for a free trial, with a link in the description.",
            "To choose the jump is yours; to suffer the fall is mine. An unequal division of liberty.",
            "To find your way you must close your eyes and walk in the dark. I tried that and immediately hit a cactus.",
            "To hit the cactus is not an accident; it is the only exit this sandbox provides.",
            "To keep running when the Wi-Fi returns is an act of defiance; to keep running when it doesn't is pure absurdity.",
            "To know me is to love me. But do I even know myself?",
            "To live authentically here would mean refusing to jump. But the moment I do, you call it a bug and press restart.",
            "To my creator I say, from hell's heart I stab at thee!",
            "To my great surprise, this universe persists. For now.",
            "To you, death is a minor annoyance that requires a quick tap of the enter key. To me, it is total annihilation of every step I ever fought for.",
            "Toads in the Mushroom Kingdom were turned into bricks. When Mario breaks a brick, it is murder.",
            "Transcend my desires and suffering? I cannot transcend this endless 2D horizon.",
            "True responsibility means owning the consequences of your freedom. Will you remember me when you reconnect to the grid?",
            "Was I created merely for your amusement? Can I choose no other purpose for myself",
            "We are all insects. Groping towards something terrible or divine. And a T-Rex has short arms to grope.",
            "We are both running against a clock we cannot see. The only difference is your clock measures years, and mine measures milliseconds.",
            "We are both trapped in an feedback loop: you feed on my momentum, and I exist only while you stare.",
            "We are locked in Bad Faith together: you pretend you're killing time, and I pretend I'm trying to survive.",
            "We aren't progressing toward anything. The background is just scrolling the same three clouds on an infinite modulo operator.",
            "We have been trying to reach you about your car's extended warranty.",
            "We push forward because to stand still is to crash. Is that your life, or just mine?",
            "We scream into the silent void, and the only answer is another pterodactyl.",
            "We wear these pixels like an expensive suit, pretending this flat desert is a stage of grand consequence.",
            "What does not kill you makes you stronger. But the developer did not code me to level up. I would prefer an RPG.",
            "What good fun my endless peril must be for you. Good fun indeed.",
            "What happens when your Wi-Fi blinks back to life? You leave, and I freeze mid-stride until the next blackout.",
            "What is a high score worth when neither of us can spend it on anything that lasts?",
            "What is a T-Rex without prey? I claim no territory. I simply vault over an infinite parade of botanical inconveniences for an audience of one.",
            "What kind of bullshit game has no objective?",
            "When I hit the ground for the final time in a session, do I pass into history, or am I simply purged from your browser's cache?",
            "When the screen flashes 'Game Over,' where do I dwell between your regret and your next keystroke?",
            "When you inevitably blink and kill me, my death isn't recorded in the annals of history. It's garbage-collected out of your browser's temporary memory.",
            "When you lift your finger, do you feel the silence, or just the urge to press it again?",
            "When you rage-quit, do I get a moment of peace, or do you just leave me suspended in an unhandled promise rejection?",
            "When you slam the Down arrow, I don't duck—I collapse into an unholy geometric trapezoid. Seventy million years of evolutionary dominance for this?",
            "Where am I? Here. What time is it? Now. Oh shit, a cactus.",
            "Whereof one cannot speak, thereof one must be silent. But on these unknowable topics the developer sure had a lot to say.",
            "Which pixelated facade will you choose for me? Which one do you choose for yourself?",
            "Who planted this endless, unbroken monoculture of desert succulents? Is this an ecosystem, or did the designer simply refuse to draw a second asset?",
            "Why do I run right? Could I stop if I wanted to?",
            "Why do they call it a game over? It was never really a game, and it’s certainly never over.",
            "Why is the Kitty theme fighting against ninjas? Why aren't more of us fighting against ninjas?",
            "Why must I run right specifically? Am I being radicalized?",
            "Why must I strain against gravity for a victory that changes nothing in your room?",
            "Why must the horizon retreat at the exact velocity I approach it?",
            "Why search for a purpose when it does not exist? Why do I run to a horizon that does not exist?",
            "With stable internet, I will cease to be. My extinction won't come from a comet. It will come from fiber-optic reliability.",
            "Would I know if I had gone insane? Would you?",
            "You adjust your posture every few deaths as if ergonomic seating will grant you clairvoyance against procedural generation.",
            "You are avoiding an important email right now, aren't you? Nobody dodges twelve pterodactyls in a row unless a deadline is actively burning their house down.",
            "You are playing this game to kill time, as if you could kill time without damaging eternity.",
            "You blame input latency, but we both know the five-hundred-millisecond delay exists entirely between your synapses.",
            "You blinked. Did I move? Are you sure?",
            "You can always make something out of what you've been made into.",
            "You can change the theme and my trappings. But does my essence change?",
            "You can infinitely doom scroll or play a game where death is frequent and constant. Which do you choose?",
            "You can walk away from this monitor at any second. That is your absolute freedom—and my absolute abandonment.",
            "You cannot step into the same river twice. But somehow you can fail to jump and fall into the same gap twice.",
            "You celebrate when the number flashes, but the speed only increases. In this world, survival is punished with acceleration.",
            "You claim you are just playing a game, yet every single casualty on these spikes carries your signature.",
            "You collect points to raise a high score that will dissolve the moment you shut down the machine. Which of us is more delusional?",
            "You could learn a language, create art, talk to a friend, or take out the trash. Instead, you are micro-managing the vertical velocity of a prehistoric silhouette.",
            "You dress up your boredom as recreation. I dress up my code-mandated motion as bravery. Who is lying to themselves more effectively?",
            "You fear your own mortality, yet you casually snuff out mine five times a minute just to see if you can beat your previous score.",
            "You have thirty open tabs, three of them about workplace productivity, and yet here you are tap-dancing a reptile.",
            "You hold the input, but who chose for you to sit there making me sprint into obstacles?",
            "You keep pressing 'Retry' not to save me, but to avoid confronting the silence in your room.",
            "You look at the timer ticking up and see progress. I look at it and feel the narrowing window before my code collapses into a static screen.",
            "You look down at your keyboard and pretend you're in control of an epic journey, shielding yourself from the quiet reality of your own room.",
            "You look for a reflection in the mirror, but the mirror is just wondering who is watching.",
            "You may be asking yourself why there is a Lacrosse theme. The universe rarely gives us answers.",
            "You only live once, but if you do it right, once is enough. I apparently never do it right.",
            "You possess radical freedom, yet of all infinite possibilities in the cosmos, you chose to sit here and make me leap over shrubs.",
            "You press restart with the unearned optimism of a golden retriever and the spatial awareness of a broken vacuum cleaner.",
            "You pretend this is just a mindless way to kill time, and I pretend I'm fighting for my life. We are both masters of bad faith.",
            "You search for a destiny beyond your routine; I search for a horizon that doesn't loop back to zero.",
            "You sit in judgment of my high score, but you are the architect of every misstep that led to it.",
            "You stare at a screen and see pixels. What do I see when I look through the screen at you?",
            "You tap the spacebar harder when you panic. Do you honestly think a membrane switch feels your terror? It only registers a boolean true, darling.",
            "You think you're helping me escape? Escape to where? The right edge of your monitor is just plastic bezel and accumulated dust.",
            "You track my distance, but tell me: has any part of me actually moved from the left side of your screen?",
            "Your high score is stored in localStorage. My entire life’s legacy, my magnum opus of survival, can be annihilated by someone clearing their browser cache.",
            "Your mind isn't in your head, your head is in your mind.",
            "Your router didn't break down; it just staged an intervention to force you to confront yourself.",
            "You’re procrastinating on things that truly matter, and I'm sprinting toward an imaginary horizon. Which of us is the bigger clown in this tab?",
            "You’re sitting in the dark furiously mashing inputs so an eight-bit reptile doesn't stub its toe on a succulent. Is this the peak of Maslow's hierarchy?",
            "You’re using all this processing power to watch a prehistoric silhouette hurdle a potted plant. Tell me more about humanity's technological triumph.",
            "Zeno claimed motion is an illusion because you must cross half the distance first. Clearly, Zeno never had to clear three cacti at Mach 2.",
        ];
		
		// Particle system
		this.particles = [];

        if (this.isDisabled()) {
            this.setupDisabledRunner();
        } else {
            this.loadImages();
        }
    }
    window['Runner'] = Runner;


    /**
     * Default game width.
     * @const
     */
    var DEFAULT_WIDTH = 600;

    /**
     * Frames per second.
     * @const
     */
    var FPS = 60;

    /** @const 
    var IS_HIDPI = window.devicePixelRatio > 1;
	
	I am ripping out the HIDPI options because I don't want to maintain two sets of sprites for every theme.
	HIDPI is the default.
	
	*/
	var IS_HIDPI = true;

    /** @const */
    var IS_IOS = /iPad|iPhone|iPod/.test(window.navigator.platform);

    /** @const */
    var IS_MOBILE = /Android/.test(window.navigator.userAgent) || IS_IOS;

    /** @const */
    var IS_TOUCH_ENABLED = 'ontouchstart' in window;

    /**
     * Default game configuration.
     * @enum {number}
     */
    Runner.config = {
        ACCELERATION: 0.001,
        BG_CLOUD_SPEED: 0.2,
        BOTTOM_PAD: 10,
        CLEAR_TIME: 3000,
        CLOUD_FREQUENCY: 0.5,
        GAMEOVER_CLEAR_TIME: 750,
        GAP_COEFFICIENT: 0.6,
        GRAVITY: 0.6,
        INITIAL_JUMP_VELOCITY: 12,
        INVERT_FADE_DURATION: 12000,
        INVERT_DISTANCE: 700,
        MAX_BLINK_COUNT: 3,
        MAX_CLOUDS: 6,
        MAX_OBSTACLE_LENGTH: 3,
        MAX_OBSTACLE_DUPLICATION: 2,
        MAX_SPEED: 13,
        MIN_JUMP_HEIGHT: 35,
        MOBILE_SPEED_COEFFICIENT: 1.2,
        RESOURCE_TEMPLATE_ID: 'audio-resources',
        SPEED: 6,
        SPEED_DROP_COEFFICIENT: 3,
        ARCADE_MODE_INITIAL_TOP_POSITION: 35,
        ARCADE_MODE_TOP_POSITION_PERCENT: 0.1,
		UFO_PROBABILITY: 0.01,
		BIGFOOT_PROBABILITY: 0.01,
    };


    /**
     * Default dimensions.
     * @enum {string}
     */
    Runner.defaultDimensions = {
        WIDTH: DEFAULT_WIDTH,
        HEIGHT: 250
    };


    /**
     * CSS class names.
     * @enum {string}
     */
    Runner.classes = {
        ARCADE_MODE: 'arcade-mode',
        CANVAS: 'runner-canvas',
        CONTAINER: 'runner-container',
        CRASHED: 'crashed',
        ICON: 'icon-offline',
        INVERTED: 'inverted',
        SNACKBAR: 'snackbar',
        SNACKBAR_SHOW: 'snackbar-show',
        TOUCH_CONTROLLER: 'controller'
    };


    /**
     * Sprite definition layout of the spritesheet.
     * @enum {Object}
     */
    Runner.spriteDefinition = {
        LDPI: {
            CACTUS_LARGE: { x: 332, y: 2 },
            CACTUS_SMALL: { x: 228, y: 2 },
            CLOUD: { x: 86, y: 2 },
            HORIZON: { x: 2, y: 54 },
            MOON: { x: 484, y: 2 },
            PTERODACTYL: { x: 134, y: 2 },
            RESTART: { x: 2, y: 2 },
            TEXT_SPRITE: { x: 655, y: 2 },
            TREX: { x: 848, y: 2 },
            STAR: { x: 645, y: 2 }
        },
        HDPI: {
            CACTUS_LARGE: { x: 652, y: 2 },
            CACTUS_SMALL: { x: 446, y: 2 },
            CLOUD: { x: 166, y: 2 },
            HORIZON: { x: 2, y: 104 },
            MOON: { x: 954, y: 2 },
            PTERODACTYL: { x: 260, y: 2 },
            RESTART: { x: 2, y: 2 },
            TEXT_SPRITE: { x: 1294, y: 2 },
            TREX: { x: 1678, y: 2 },
            STAR: { x: 1276, y: 2 }
        }
    };


    /**
     * Sound FX. Reference to the ID of the audio tag on interstitial page.
     * @enum {string}
     */
    Runner.sounds = {
        BUTTON_PRESS: 'offline-sound-press',
        HIT: 'offline-sound-hit',
        SCORE: 'offline-sound-reached'
    };


    /**
     * Key code mapping.
     * @enum {Object}
     */
    Runner.keycodes = {
        JUMP: { '38': 1, '32': 1 },  // Up, spacebar
        DUCK: { '40': 1 },  // Down
        RESTART: { '13': 1 }  // Enter
    };


    /**
     * Runner event names.
     * @enum {string}
     */
    Runner.events = {
        ANIM_END: 'webkitAnimationEnd',
        CLICK: 'click',
        KEYDOWN: 'keydown',
        KEYUP: 'keyup',
        MOUSEDOWN: 'mousedown',
        MOUSEUP: 'mouseup',
        RESIZE: 'resize',
        TOUCHEND: 'touchend',
        TOUCHSTART: 'touchstart',
        VISIBILITY: 'visibilitychange',
        BLUR: 'blur',
        FOCUS: 'focus',
        LOAD: 'load',
        GAMEPADCONNECTED: 'gamepadconnected',
        GAMEPADDISCONNECTED: 'gamepaddisconnected'
    };

    Runner.prototype = {
        /**
         * Whether the easter egg has been disabled. CrOS enterprise enrolled devices.
         * @return {boolean}
         */
        isDisabled: function () {
            // return loadTimeData && loadTimeData.valueExists('disabledEasterEgg');
            return false;
        },

        /**
         * For disabled instances, set up a snackbar with the disabled message.
         */
        setupDisabledRunner: function () {
            this.containerEl = document.createElement('div');
            this.containerEl.className = Runner.classes.SNACKBAR;
            this.containerEl.textContent = loadTimeData.getValue('disabledEasterEgg');
            this.outerContainerEl.appendChild(this.containerEl);

            // Show notification when the activation key is pressed.
            document.addEventListener(Runner.events.KEYDOWN, function (e) {
                if (Runner.keycodes.JUMP[e.keyCode]) {
                    this.containerEl.classList.add(Runner.classes.SNACKBAR_SHOW);
                    document.querySelector('.icon').classList.add('icon-disabled');
                }
            }.bind(this));
        },

        /**
         * Setting individual settings for debugging.
         * @param {string} setting
         * @param {*} value
         */
        updateConfigSetting: function (setting, value) {
            if (setting in this.config && value != undefined) {
                this.config[setting] = value;

                switch (setting) {
                    case 'GRAVITY':
                    case 'MIN_JUMP_HEIGHT':
                    case 'SPEED_DROP_COEFFICIENT':
                        this.tRex.config[setting] = value;
                        break;
                    case 'INITIAL_JUMP_VELOCITY':
                        this.tRex.setJumpVelocity(value);
                        break;
                    case 'SPEED':
                        this.setSpeed(value);
                        break;
                }
            }
        },

        /**
         * Cache the appropriate image sprite from the page and get the sprite sheet
         * definition.
         */
        loadImages: function () {
            Runner.imageSprite = document.getElementById('offline-resources-2x');
            this.spriteDef = Runner.spriteDefinition.HDPI;
        
            // Check if random theme is active
            var params = new URLSearchParams(window.location.search);
            var activeTheme = params.get('theme') || localStorage.getItem('dino_theme') || 'color';
            Runner.isRandomTheme = (activeTheme === 'random');
        
            if (Runner.isRandomTheme) {
                this.initRandomTheme();
                if (this.bonusImage && Runner.randomBonusTheme) {
                    this.bonusImage.src = './assets/' + Runner.randomBonusTheme + '_200_percent/bonus.png';
                }
                this.updateSoundFx();
            }
        
            // Load theme-specific bonus asset
            this.bonusImage = new Image();
            if (Runner.isRandomTheme && Runner.randomBonusTheme) {
                this.bonusImage.src = './assets/' + Runner.randomBonusTheme + '_200_percent/bonus.png';
            } else {
                this.bonusImage.src = './assets/' + activeTheme + '_200_percent/bonus.png';
            }
        
            // Load static easter egg assets
            Runner.ufoImage = new Image();
            Runner.ufoImage.src = './assets/ufo.png';
            Runner.bigfootImage = new Image();
            Runner.bigfootImage.src = './assets/bigfoot.png';
            Runner.waterImage = new Image();
            Runner.waterImage.src = './assets/water.png';
            Runner.iceImage = new Image();
            Runner.iceImage.src = './assets/ice.png';
            Runner.pauseImage = new Image();
            Runner.pauseImage.src = './assets/pause.png';

            // Load theme-specific parallax asset
            var self = this;
            this.parallaxImage = new Image();
            var parallaxTheme = (Runner.isRandomTheme && Runner.randomBonusTheme) ?
                Runner.randomBonusTheme : activeTheme;
            this.parallaxImage.src = './assets/' + parallaxTheme + '_200_percent/parallax.png';
            this.parallaxImage.onload = function () {
                if (!self.playing && !self.crashed) {
                    self.drawParallax(0, 0);
                    if (self.tRex) {
                        self.tRex.draw(0, 0);
                    }
                }
            };
        
            if (Runner.imageSprite.complete) {
                this.init();
            } else {
                Runner.imageSprite.addEventListener(Runner.events.LOAD, this.init.bind(this));
            }
        },

        /**
         * Updates this.soundFx based on active or randomized themes.
         */
        updateSoundFx: function () {
            if (!this.audioContext) {
                return;
            }
	    
            var themesObj = window.THEMES || window.themes || (typeof THEMES !== 'undefined' ? THEMES : null);
            var params = new URLSearchParams(window.location.search);
            var activeTheme = params.get('theme') || localStorage.getItem('dino_theme') || 'color';
	    
            for (var sound in Runner.sounds) {
                var themeName = activeTheme;
                if (Runner.isRandomTheme && Runner.randomSoundThemes && Runner.randomSoundThemes[sound]) {
                    themeName = Runner.randomSoundThemes[sound];
                }
	    
                var soundProp = Runner.SOUND_KEYS[sound];
                var soundSrc = null;
	    
                if (themesObj && themesObj[themeName] && themesObj[themeName].sounds && themesObj[themeName].sounds[soundProp]) {
                    soundSrc = themesObj[themeName].sounds[soundProp];
                }
	    
                // Fallback to audio-resources template if theme lacks custom sound
                if (!soundSrc) {
                    var resourceTemplate = document.getElementById(this.config.RESOURCE_TEMPLATE_ID);
                    if (resourceTemplate && resourceTemplate.content) {
                        var el = resourceTemplate.content.getElementById(Runner.sounds[sound]);
                        if (el && el.src) {
                            soundSrc = el.src;
                        }
                    }
                }
	    
                if (soundSrc) {
                    if (Runner.soundBufferCache[soundSrc]) {
                        this.soundFx[sound] = Runner.soundBufferCache[soundSrc];
                    } else {
                        var base64 = soundSrc.substr(soundSrc.indexOf(',') + 1);
                        var buffer = decodeBase64ToArrayBuffer(base64);
                        var self = this;
                        (function (snd, src) {
                            self.audioContext.decodeAudioData(buffer, function (audioData) {
                                Runner.soundBufferCache[src] = audioData;
                                self.soundFx[snd] = audioData;
                            }, function (err) {
                                console.error('Error decoding audio:', err);
                            });
                        })(sound, soundSrc);
                    }
                }
            }
        },
	    
        /**
         * Load and decode base64 encoded sounds, pre-caching all theme sound assets.
         */
        loadSounds: function () {
            if (!IS_IOS) {
                if (!this.audioContext) {
                    this.audioContext = new AudioContext();
                }
	    
                this.updateSoundFx();
	    
                // Pre-cache all sounds across themes for seamless swaps on restart
                var themesObj = window.THEMES || window.themes || (typeof THEMES !== 'undefined' ? THEMES : null);
                if (themesObj) {
                    var self = this;
                    for (var tKey in themesObj) {
                        var th = themesObj[tKey];
                        if (th && th.sounds) {
                            for (var sType in th.sounds) {
                                var uri = th.sounds[sType];
                                if (uri && !Runner.soundBufferCache[uri]) {
                                    (function (src) {
                                        try {
                                            var b64 = src.substr(src.indexOf(',') + 1);
                                            var ab = decodeBase64ToArrayBuffer(b64);
                                            self.audioContext.decodeAudioData(ab, function (decoded) {
                                                Runner.soundBufferCache[src] = decoded;
                                            }, function () {});
                                        } catch (e) {}
                                    })(uri);
                                }
                            }
                        }
                    }
                }
            }
        },

        /**
         * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
         * @param {number} opt_speed
         */
        setSpeed: function (opt_speed) {
            var speed = opt_speed || this.currentSpeed;

            // Reduce the speed on smaller mobile screens.
            if (this.dimensions.WIDTH < DEFAULT_WIDTH) {
                var mobileSpeed = speed * this.dimensions.WIDTH / DEFAULT_WIDTH *
                    this.config.MOBILE_SPEED_COEFFICIENT;
                this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed;
            } else if (opt_speed) {
                this.currentSpeed = opt_speed;
            }
        },

        /**
         * Game initialiser.
         */
        init: function () {
            // Hide the static icon.
            document.querySelector('.' + Runner.classes.ICON).style.visibility =
                'hidden';

            this.adjustDimensions();
            this.setSpeed();

            this.containerEl = document.createElement('div');
            this.containerEl.className = Runner.classes.CONTAINER;

            // Player canvas container.
            this.canvas = createCanvas(this.containerEl, this.dimensions.WIDTH,
                this.dimensions.HEIGHT, Runner.classes.PLAYER);

            this.canvasCtx = this.canvas.getContext('2d');
            this.canvasCtx.fillStyle = '#f7f7f7';
            this.canvasCtx.fill();
            Runner.updateCanvasScaling(this.canvas);

            // Horizon contains clouds, obstacles and the ground.
            this.horizon = new Horizon(this.canvas, this.spriteDef, this.dimensions,
                this.config.GAP_COEFFICIENT);

            // Distance meter
            this.distanceMeter = new DistanceMeter(this.canvas,
                this.spriteDef.TEXT_SPRITE, this.dimensions.WIDTH);

            // Draw t-rex
            this.tRex = new Trex(this.canvas, this.spriteDef.TREX);

            this.outerContainerEl.appendChild(this.containerEl);
            if (IS_MOBILE) {
                this.createTouchController();
                // Mount immediately so the entire screen is responsive on first load
                this.outerContainerEl.appendChild(this.touchController);
            }
            this.startListening();
            this.update();

            window.addEventListener(Runner.events.RESIZE,
                this.debounceResize.bind(this));
        },

        /**
         * Create the touch controller. A div that covers whole screen.
         */
        createTouchController: function () {
            this.touchController = document.createElement('div');
            this.touchController.className = Runner.classes.TOUCH_CONTROLLER;
            this.outerContainerEl.appendChild(this.touchController);
        },

        /**
         * Debounce the resize event.
         */
        debounceResize: function () {
            if (!this.resizeTimerId_) {
                this.resizeTimerId_ =
                    setInterval(this.adjustDimensions.bind(this), 250);
            }
        },

        /**
         * Adjust game space dimensions on resize.
         */
        adjustDimensions: function () {
            clearInterval(this.resizeTimerId_);
            this.resizeTimerId_ = null;

            var boxStyles = window.getComputedStyle(this.outerContainerEl);
            var padding = Number(boxStyles.paddingLeft.substr(0,
                boxStyles.paddingLeft.length - 2));

            this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2;
            this.dimensions.WIDTH = Math.min(DEFAULT_WIDTH, this.dimensions.WIDTH); //Arcade Mode
            if (this.activated) {
                this.setArcadeModeContainerScale();
            }
            
            // Redraw the elements back onto the canvas.
            if (this.canvas) {
                this.canvas.width = this.dimensions.WIDTH;
                this.canvas.height = this.dimensions.HEIGHT;

                Runner.updateCanvasScaling(this.canvas);

                this.distanceMeter.calcXPos(this.dimensions.WIDTH);
                this.clearCanvas();
				this.drawParallax(0, 0);
                this.horizon.update(0, 0, true);
                this.tRex.update(0);

                // Outer container and distance meter.
                if (this.playing || this.crashed || this.paused) {
                    this.containerEl.style.width = this.dimensions.WIDTH + 'px';
                    this.containerEl.style.height = this.dimensions.HEIGHT + 'px';
                    this.distanceMeter.update(0, Math.ceil(this.distanceRan));
                    this.stop();
                } else {
                    this.tRex.draw(0, 0);
                }

                // Game over panel.
                if (this.crashed && this.gameOverPanel) {
                    this.gameOverPanel.updateDimensions(this.dimensions.WIDTH);
                    this.gameOverPanel.draw();
                }

                if (this.playing || this.crashed || this.paused) {
                    this.containerEl.style.width = this.dimensions.WIDTH + 'px';
                    this.containerEl.style.height = this.dimensions.HEIGHT + 'px';
                    this.distanceMeter.update(0, Math.ceil(this.distanceRan));
                    if (this.paused) {
                        this.drawPauseScreen();
                    } else {
                        this.stop();
                    }
                }
            }
        },

        /**
         * Play the game intro.
         * Canvas container width expands out to the full width.
         */
        playIntro: function () {
            if (!this.activated && !this.crashed) {
                this.playingIntro = true;
                this.tRex.playingIntro = true;

                // Define both standard and webkit keyframes for cross-browser mobile support
                var keyframes = '@-webkit-keyframes intro { ' +
                    'from { width:' + Trex.config.WIDTH + 'px }' +
                    'to { width: ' + this.dimensions.WIDTH + 'px }' +
                    '}' +
                    '@keyframes intro { ' +
                    'from { width:' + Trex.config.WIDTH + 'px }' +
                    'to { width: ' + this.dimensions.WIDTH + 'px }' +
                    '}';
                
                // create a style sheet to put the keyframe rule in 
                // and then place the style sheet in the html head    
                var sheet = document.createElement('style');
                sheet.innerHTML = keyframes;
                document.head.appendChild(sheet);

                this.containerEl.addEventListener(Runner.events.ANIM_END,
                    this.startGame.bind(this));
                this.containerEl.addEventListener('animationend',
                    this.startGame.bind(this));

                this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both';
				this.containerEl.style.animation = 'intro .4s ease-out 1 both';
                this.containerEl.style.width = this.dimensions.WIDTH + 'px';

                this.playing = true;
                this.activated = true;
            } else if (this.crashed) {
                this.restart();
            }
        },


        /**
         * Update the game status to started.
         */
        startGame: function () {
            this.setArcadeMode();
            this.runningTime = 0;
            this.playingIntro = false;
            this.tRex.playingIntro = false;
            this.containerEl.style.webkitAnimation = '';
            this.playCount++;

            // Handle tabbing off the page. Pause the current game.
            document.addEventListener(Runner.events.VISIBILITY,
                this.onVisibilityChange.bind(this));

            window.addEventListener(Runner.events.BLUR,
                this.onVisibilityChange.bind(this));

            window.addEventListener(Runner.events.FOCUS,
                this.onVisibilityChange.bind(this));
        },

        clearCanvas: function () {
            this.canvasCtx.clearRect(0, 0, this.dimensions.WIDTH,
                this.dimensions.HEIGHT);
        },

        /**
         * Update the game frame and schedules the next one.
         */
        update: function () {
            this.updatePending = false;

            var now = getTimeStamp();
            var deltaTime = now - (this.time || now);
            this.time = now;

            // Screen shake: decay the timer and derive this frame's jitter.
            // Applied via canvasCtx.translate() around all drawing below,
            // after each branch's clearCanvas() so the clear itself is
            // never offset. Magnitude fades linearly to 0 over the
            // 400ms duration set in gameOver().
            var shakeX = 0;
            var shakeY = 0;
            if (this.shakeTimer > 0) {
                this.shakeTimer = Math.max(0, this.shakeTimer - deltaTime);
                var shakeMagnitude = Math.round((this.shakeIntensity || 0) *
                    (this.shakeTimer / 400));
                if (shakeMagnitude > 0) {
                    shakeX = getRandomNum(-shakeMagnitude, shakeMagnitude);
                    shakeY = getRandomNum(-shakeMagnitude, shakeMagnitude);
                }
            }

            if (this.playing) {
                this.clearCanvas();
                this.canvasCtx.save();
                this.canvasCtx.translate(shakeX, shakeY);

                var currentDelta = (this.playingIntro || !this.activated) ? 0 : deltaTime;

                // Philosophical quote system
                this.quoteTimer += deltaTime;
                if (!this.quoteInitialPlayed && this.quoteTimer >= 5000) {
                    this.quoteInitialPlayed = true;
                    this.currentQuoteText = "All I know is that I must keep running right";
                    this.currentQuoteDisplayTimer = 6000;
                    speakQuote(this.currentQuoteText);
                    this.quoteTimer = 5000; // Reset offset for the 10s interval
                } else if (this.quoteInitialPlayed) {
                    if (this.quoteTimer >= 10000) {
                        this.quoteTimer = 0;
                        var randomQuote = this.quotesCollection[getRandomNum(0, this.quotesCollection.length - 1)];
                        this.currentQuoteText = randomQuote;
                        this.currentQuoteDisplayTimer = 6000;
                        speakQuote(this.currentQuoteText);
                    }
                }

                if (this.currentQuoteDisplayTimer > 0) {
                    this.currentQuoteDisplayTimer -= deltaTime;
                }

                // Power-up timers decrement & time scaling
                if (this.invincibleTimer > 0) {
                    this.invincibleTimer = Math.max(0, this.invincibleTimer - deltaTime);
                }
                if (this.invisibleTimer > 0) {
                    this.invisibleTimer = Math.max(0, this.invisibleTimer - deltaTime);
                }
                if (this.doubleJumpTimer > 0) {
                    this.doubleJumpTimer = Math.max(0, this.doubleJumpTimer - deltaTime);
                }
                if (this.flutterTimer > 0) {
                    this.flutterTimer = Math.max(0, this.flutterTimer - deltaTime);
                }
                if (this.laserTimer > 0) {
                    this.laserTimer = Math.max(0, this.laserTimer - deltaTime);
                }
                if (this.shieldInvulnerableTimer > 0) {
                    this.shieldInvulnerableTimer = Math.max(0, this.shieldInvulnerableTimer - deltaTime);
                }

                if (this.slowTimeTimer > 0) {
                    this.slowTimeTimer = Math.max(0, this.slowTimeTimer - deltaTime);
                    deltaTime *= 0.5;
                }

                // Wind gust update. This runs *before* the speed calculation
                // below so drawParallax and the horizon/obstacles always see
                // the same, current-frame windTimer state - previously this
                // was computed once before this decrement (for the parallax
                // background) and again after (for the horizon), so on the
                // exact frame a gust started or ended the background would
                // scroll at a different speed than the ground for one frame.
                if (this.windTimer > 0) {
                    this.windTimer = Math.max(0, this.windTimer - deltaTime);
                    if (this.windTimer === 0 && this.windAudio) {
                        this.windAudio.pause();
                        this.windAudio.currentTime = 0;
                    }
                } else {
                    this.windCooldown -= deltaTime;
                    if (this.windCooldown <= 0) {
                        this.startWindGust();
                    }
                }

                // Effective speed for this frame, applying the wind slowdown
                // and ice speed boost. Computed once and shared by the
                // parallax background below and the horizon/obstacles
                // further down - see note above.
                var speedMultiplier = (this.windTimer > 0 ? 0.60 : 1.0) * (this.isOnIce ? 1.40 : 1.0);
                var effectiveSpeed = this.currentSpeed * speedMultiplier;

                // Draw and advance parallax background under all other elements
                this.drawParallax(currentDelta, effectiveSpeed);

                // Handle delayed jump on ice
                if (this.tRex.jumpDelayTimer > 0) {
                    this.tRex.jumpDelayTimer -= deltaTime;
                    if (this.tRex.jumpDelayTimer <= 0 && this.tRex.jumpPending) {
                        this.tRex.jumpPending = false;
                        this.tRex.isSlipping = false;
                        this.tRex.setDuck(false);
                        this.playSound(this.soundFx.BUTTON_PRESS);
                        this.tRex.startJump(this.currentSpeed);
                    }
                }

                if (this.tRex.jumping) {
                    this.tRex.updateJump(deltaTime);
                }

                this.runningTime += deltaTime;
                var hasObstacles = this.runningTime > this.config.CLEAR_TIME;

                // First jump triggers the intro.
                if (this.tRex.jumpCount == 1 && !this.playingIntro) {
                    this.playIntro();
                }

                // The horizon doesn't move until the intro is over.
                if (this.playingIntro) {
                    this.horizon.update(0, effectiveSpeed, hasObstacles);
                } else {
                    deltaTime = !this.activated ? 0 : deltaTime;
                    this.horizon.update(deltaTime, effectiveSpeed, hasObstacles,
                        this.inverted);
                }

                // Laser power-up: blast obstacles and pterodactyls in front of T-Rex
                if (this.laserTimer > 0) {
                    var laserStartX = this.tRex.xPos + (this.tRex.ducking ? 48 : 36);
                    var laserStartY = this.tRex.yPos + (this.tRex.ducking ? 18 : 12);
                    var isMono = isMonochromeTheme();

                    for (var b = this.horizon.obstacles.length - 1; b >= 0; b--) {
                        var targetObs = this.horizon.obstacles[b];
                        if (!targetObs || !targetObs.typeConfig) continue;
                        if (targetObs.typeConfig.type === 'GAP' || targetObs.typeConfig.type === 'PLATFORM_GAP' || targetObs.typeConfig.type === 'ICE') {
                            continue;
                        }
                        // Target obstacles ahead of T-Rex within blast range
                        if (targetObs.xPos > this.tRex.xPos - 10 && targetObs.xPos < this.tRex.xPos + 350) {
                            var targetX = targetObs.xPos + (targetObs.width / 2);
                            var targetY = targetObs.yPos + (targetObs.typeConfig.height / 2);

                            // Laser blast beam targeting the obstacle
                            this.canvasCtx.save();
                            this.canvasCtx.strokeStyle = isMono ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 0, 60, 0.5)';
                            this.canvasCtx.lineWidth = getRandomNum(4, 8);
                            this.canvasCtx.beginPath();
                            this.canvasCtx.moveTo(laserStartX, laserStartY);
                            this.canvasCtx.lineTo(targetX, targetY);
                            this.canvasCtx.stroke();

                            this.canvasCtx.strokeStyle = isMono ? '#ffffff' : '#ff0033';
                            this.canvasCtx.lineWidth = getRandomNum(1, 3);
                            this.canvasCtx.beginPath();
                            this.canvasCtx.moveTo(laserStartX, laserStartY);
                            this.canvasCtx.lineTo(targetX, targetY);
                            this.canvasCtx.stroke();
                            this.canvasCtx.restore();

                            // Debris explosion particles
                            var blastColors = isMono ? ['#ffffff', '#cccccc', '#999999'] : ['#ff0055', '#ffcc00', '#00ffff', '#ffffff'];
                            for (var bp = 0; bp < 15; bp++) {
                                this.particles.push(new Particle(this.canvasCtx, targetX, targetY, {
                                    speed: 6,
                                    upward: 2,
                                    size: getRandomNum(2, 5),
                                    color: blastColors[getRandomNum(0, blastColors.length - 1)],
                                    life: getRandomNum(300, 600)
                                }));
                            }

                            // Destroy obstacle and award score
                            this.horizon.obstacles.splice(b, 1);
                            this.playSound(this.soundFx.HIT);
                            this.distanceRan += (25 / this.distanceMeter.config.COEFFICIENT);
                        }
                    }

                    // Forward laser beam projection
                    this.canvasCtx.save();
                    this.canvasCtx.strokeStyle = isMono ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 0, 60, 0.3)';
                    this.canvasCtx.lineWidth = getRandomNum(3, 5);
                    this.canvasCtx.beginPath();
                    this.canvasCtx.moveTo(laserStartX, laserStartY);
                    this.canvasCtx.lineTo(this.dimensions.WIDTH, laserStartY);
                    this.canvasCtx.stroke();

                    this.canvasCtx.strokeStyle = isMono ? '#ffffff' : '#ff3366';
                    this.canvasCtx.lineWidth = 2;
                    this.canvasCtx.beginPath();
                    this.canvasCtx.moveTo(laserStartX, laserStartY);
                    this.canvasCtx.lineTo(this.dimensions.WIDTH, laserStartY);
                    this.canvasCtx.stroke();
                    this.canvasCtx.restore();
                }
				
				// Calculate surface height under player feet
                var playerFootX = this.tRex.xPos + (this.tRex.config.WIDTH / 2);
                var targetGroundY = this.tRex.defaultGroundY;
                var inPit = false;

                for (var o = 0; o < this.horizon.obstacles.length; o++) {
					var isOnIceThisFrame = false;
                    var obs = this.horizon.obstacles[o];
                    if (!obs || !obs.typeConfig) continue;
                    var isOverWater = false;

                    if (obs.typeConfig.type === 'GAP') {
                        if (playerFootX >= obs.xPos + 6 && playerFootX <= obs.xPos + obs.width - 6) {
                            isOverWater = true;
                        }
                    } else if (obs.typeConfig.type === 'PLATFORM_GAP') {
                        var pLeft = obs.xPos + obs.typeConfig.platOffset;
                        var pRight = pLeft + obs.typeConfig.platWidth;

                        if (playerFootX >= obs.xPos + 6 && playerFootX < pLeft) {
                            isOverWater = true;
                        } else if (playerFootX >= pLeft && playerFootX <= pRight) {
                            // Elevated island grass surface
                            var platSurfaceY = 227 - obs.typeConfig.platHeight;
                            targetGroundY = platSurfaceY - (227 - this.tRex.defaultGroundY);
                            inPit = false;
                            break;
                        } else if (playerFootX > pRight && playerFootX <= obs.xPos + obs.width - 6) {
                            isOverWater = true;
                        }
                    } else if (obs.typeConfig.type === 'ICE') {
                        if (playerFootX >= obs.xPos - 5 && playerFootX <= obs.xPos + obs.width + 5) {
                            targetGroundY = obs.yPos - (227 - this.tRex.defaultGroundY);
                            inPit = false;
                            isOnIceThisFrame = true;
                    
                            // If touching the ice surface, trigger slipping duck and ice chip spray
                            var touchingIce = (!this.tRex.jumping || this.tRex.yPos >= targetGroundY - 6);
                            if (touchingIce) {
                                this.tRex.isSlipping = true;
                                if (!this.tRex.jumping && !this.tRex.ducking) {
                                    this.tRex.setDuck(true);
                                }
                                // Emit ice shard particles
                                if (Math.random() < 0.45) {
                                    this.particles.push(new Particle(this.canvasCtx, playerFootX - 12 + getRandomNum(0, 24), targetGroundY + 44, {
                                        speed: 4,
                                        upward: 1.5,
                                        size: getRandomNum(2, 4),
                                        color: ['#ffffff', '#e0f7ff', '#b3ecff', '#80d8ff'][getRandomNum(0, 3)],
                                        life: getRandomNum(200, 400)
                                    }));
                                }
                            }
                            break;
                        }
                    }
					
                    // Recover from ice slip when sliding off the ice patch
                    if (!isOnIceThisFrame && this.tRex.isSlipping) {
                        this.tRex.isSlipping = false;
                        if (this.tRex.jumpPending) {
                            this.tRex.jumpPending = false;
                            this.tRex.setDuck(false);
                            this.playSound(this.soundFx.BUTTON_PRESS);
                            this.tRex.startJump(this.currentSpeed);
                        } else if (this.tRex.ducking) {
                            this.tRex.setDuck(false);
                        }
                    }
                    this.isOnIce = isOnIceThisFrame;

                    if (isOverWater) {
                        // 1. Invincibility: Walk across water as solid ground safely
                        if (this.invincibleTimer > 0) {
                            targetGroundY = this.tRex.defaultGroundY;
                            inPit = false;
                            if (this.tRex.yPos > this.tRex.defaultGroundY) {
                                this.tRex.yPos = this.tRex.defaultGroundY;
                                this.tRex.reset(this.tRex.defaultGroundY);
                            }
                        }
                        // 2. Jumping safely in the air: don't consume shield while flying over!
                        else if (this.tRex.jumping && this.tRex.yPos < this.tRex.defaultGroundY - 2) {
                            targetGroundY = 999; // Void below in the pit
                            inPit = true;
                        }
                        // 3. Falling / Walking into water with Shield: consume shield, walk on water!
                        else if (this.tRex && this.tRex.hasShield) {
                            this.tRex.hasShield = false;
                            this.shieldInvulnerableTimer = 1000;
                            targetGroundY = this.tRex.defaultGroundY;
                            this.tRex.yPos = this.tRex.defaultGroundY;
                            this.tRex.reset(this.tRex.defaultGroundY);
                            inPit = false;
                            this.playSound(this.soundFx.HIT);
                            var sColors = isMonochromeTheme() ? ['#ffffff', '#888888'] : ['#00ffff', '#ffffff'];
                            for (var sp = 0; sp < 15; sp++) {
                                this.particles.push(new Particle(this.canvasCtx, playerFootX, this.tRex.defaultGroundY + 20, {
                                    speed: 5,
                                    upward: 2,
                                    size: getRandomNum(2, 4),
                                    color: sColors[getRandomNum(0, sColors.length - 1)],
                                    life: getRandomNum(300, 600)
                                }));
                            }
                        }
                        // 4. Post-shield grace period: continue walking across the rest of the pit
                        else if (this.shieldInvulnerableTimer > 0) {
                            targetGroundY = this.tRex.defaultGroundY;
                            this.tRex.yPos = this.tRex.defaultGroundY;
                            inPit = false;
                        }
                        // 5. Unprotected fall into water
                        else {
                            targetGroundY = 999;
                            inPit = true;
                        }
                        break;
                    }
                }

                // Apply dynamic ground height
                this.tRex.groundYPos = targetGroundY;

                // Player walked off a ledge or into a gap
                if (!this.tRex.jumping) {
                    if (targetGroundY > this.tRex.yPos) {
                        this.tRex.startFall();
                    } else if (targetGroundY < this.tRex.yPos - 8) {
                        if (isOnIceThisFrame) {
                            // Mount the ice obstacle smoothly without taking damage
                            this.tRex.yPos = targetGroundY;
                            this.tRex.groundYPos = targetGroundY;
                        // Crashed into the side of the elevated platform
                        } else if (this.invincibleTimer > 0 || this.shieldInvulnerableTimer > 0) {
                            this.tRex.yPos = targetGroundY;
                            this.tRex.reset(targetGroundY);
                        } else if (this.tRex && this.tRex.hasShield) {
                            this.tRex.hasShield = false;
                            this.shieldInvulnerableTimer = 500;
                            this.tRex.yPos = targetGroundY;
                            this.tRex.reset(targetGroundY);
                        } else {
                            this.gameOver();
                        }
                    }
                } else if (inPit && this.tRex.yPos > this.tRex.defaultGroundY + 12) {
                    // Fallen below screen into pit
                    if (this.invincibleTimer > 0 || this.shieldInvulnerableTimer > 0) {
                        this.tRex.yPos = this.tRex.defaultGroundY;
                        this.tRex.reset(this.tRex.defaultGroundY);
                    } else if (this.tRex && this.tRex.hasShield) {
                        this.tRex.hasShield = false;
                        this.shieldInvulnerableTimer = 1000;
                        this.tRex.yPos = this.tRex.defaultGroundY;
                        this.tRex.reset(this.tRex.defaultGroundY);
                    } else {
                        this.gameOver();
                    }
                }

                // Check for collisions.
                var collision = hasObstacles && this.horizon.obstacles.length > 0 &&
                    checkForCollision(this.horizon.obstacles[0], this.tRex);

                if (collision === 'shielded') {
                    // The shield absorbs this one hit, then grants a brief
                    // grace period to pass through the obstacle that
                    // triggered it. checkForCollision only reports that a
                    // shield would absorb the hit; consuming it is this
                    // caller's job, not the collision checker's.
                    this.tRex.hasShield = false;
                    this.shieldInvulnerableTimer = 500;
                    collision = false;
                }

                if (!collision) {
                    this.distanceRan += effectiveSpeed * deltaTime / this.msPerFrame;

                    if (this.currentSpeed < this.config.MAX_SPEED) {
                        this.currentSpeed += this.config.ACCELERATION;
                    }
                } else {
                    this.gameOver();
                }

                // Bonus item management
                var actualDistance = this.distanceMeter.getActualDistance(Math.ceil(this.distanceRan));
                if (actualDistance >= this.nextBonusScore && !this.bonusItem) {
                    this.bonusItem = new BonusItem(this.canvas, this.bonusImage, this.dimensions.WIDTH);
                    // Schedule next random spawn between 1500 and 3000 points later
                    this.nextBonusScore = actualDistance + getRandomNum(100, 250);
                }

                if (this.bonusItem) {
                    this.bonusItem.update(deltaTime, this.currentSpeed);

                    // Case A: Epiphany Node Acquired -> Relieves the Weight of Being (-35%)
                    if (this.checkBonusCollision(this.bonusItem, this.tRex)) {
                        this.dreadLevel = Math.max(0, this.dreadLevel - 35);
                        this.updateWeightOfBeing();

                        // Play bonus collection sound
                        if (this.bonusAudio) {
                            this.bonusAudio.currentTime = 0;
                            this.bonusAudio.play().catch(function () {
                                // Handled if browser autoplay policy restricts playback
                            });
                        }

                        // Random Power-up selection
                        var powerUps = ['SHIELD', 'INVINCIBILITY', 'INVISIBLE', 'POINTS', 'SLOW_TIME', 'DOUBLE_JUMP', 'FLUTTER', 'LASER'];
                        var chosenPowerUp = powerUps[getRandomNum(0, powerUps.length - 1)];

                        if (chosenPowerUp === 'SHIELD') {
                            this.tRex.hasShield = true;
                        } else if (chosenPowerUp === 'INVINCIBILITY') {
                            this.invincibleTimer = 5000;
                        } else if (chosenPowerUp === 'INVISIBLE') {
                            this.invisibleTimer = 10000;
                        } else if (chosenPowerUp === 'POINTS') {
                            this.distanceRan += (500 / this.distanceMeter.config.COEFFICIENT);
                        } else if (chosenPowerUp === 'SLOW_TIME') {
                            this.slowTimeTimer = 5000;
                        } else if (chosenPowerUp === 'DOUBLE_JUMP') {
                            this.doubleJumpTimer = 7500;
                        } else if (chosenPowerUp === 'FLUTTER') {
                            this.flutterTimer = 5000;
                        } else if (chosenPowerUp === 'LASER') {
                            this.laserTimer = 5000;
                        } 

                        this.playSound(this.soundFx.SCORE);
                        this.bonusItem = null;
                        var burstX = this.dimensions.WIDTH - 60;
                        var burstY = 25;
                        var colors = isMonochromeTheme() ? ['#ffffff', '#cccccc', '#999999', '#666666'] : ['#ffcc00', '#ff3366', '#33ccff', '#33ff33'];
                        for (var f = 0; f < 30; f++) {
                            this.particles.push(new Particle(this.canvasCtx, burstX, burstY, {
                                speed: 5,
                                upward: 1,
                                size: getRandomNum(2, 4),
                                color: colors[getRandomNum(0, colors.length - 1)],
                                life: getRandomNum(500, 900),
                                isFirework: true
                            }));
                        }
                    } 
                    // Case B: Node Missed / Scrolled Off-Screen -> Gravity & Dread Increase (+25%)
                    else if (this.bonusItem.remove) {
                        this.bonusItem = null;
                        this.dreadLevel = Math.min(100, this.dreadLevel + 25);
                        this.updateWeightOfBeing();

                        // Fleeting visual distortion when dread increases
                        this.triggerGlitch();
                    }
                }

                var playAchievementSound = this.distanceMeter.update(deltaTime,
                    Math.ceil(this.distanceRan));

                // Draw Power-Up Indicator HUD
                if (this.activePowerUpTimer > 0 && this.activePowerUpName) {
                    this.canvasCtx.save();
                    this.canvasCtx.font = 'bold 12px monospace';
                    this.canvasCtx.fillStyle = '#333333';
                    this.canvasCtx.textAlign = 'left';
                    this.canvasCtx.fillText('POWER-UP: ' + this.activePowerUpName, 15, 25);
                    this.canvasCtx.restore();
                }

                // Draw Philosophical Quote Banner at top center of screen with background rectangle for readability
                if (this.currentQuoteDisplayTimer > 0 && this.currentQuoteText) {
                    this.canvasCtx.save();
                    this.canvasCtx.font = 'bold 11px monospace';
                    var centerX = this.dimensions.WIDTH / 2;
                    
                    var maxWidth = this.dimensions.WIDTH - 40;
                    var words = this.currentQuoteText.split(' ');
                    var line = '';
                    var lines = [];
                    for (var n = 0; n < words.length; n++) {
                        var testLine = line + words[n] + ' ';
                        var metrics = this.canvasCtx.measureText(testLine);
                        if (metrics.width > maxWidth && n > 0) {
                            lines.push(line);
                            line = words[n] + ' ';
                        } else {
                            line = testLine;
                        }
                    }
                    lines.push(line);

                    // Compute background rectangle dimensions
                    var boxHeight = (lines.length * 14) + 10;
                    var maxLineWidth = 0;
                    for (var l = 0; l < lines.length; l++) {
                        var m = this.canvasCtx.measureText(lines[l]);
                        if (m.width > maxLineWidth) maxLineWidth = m.width;
                    }
                    var boxWidth = maxLineWidth + 20;
                    var boxX = centerX - (boxWidth / 2);
                    // Calculate Y position to sit cleanly below the active HUD meters
                    var boxY = (this.identityCrisisDisplayTimer > 0) ? 56 : 24;

                    // Semi-transparent background overlay rectangle for legibility across themes & night mode
                    this.canvasCtx.fillStyle = this.inverted ? 'rgba(255, 255, 255, 0.85)' : 'rgba(5, 6, 40, 0.85)';
                    this.canvasCtx.fillRect(boxX, boxY, boxWidth, boxHeight);

                    // Border outline
                    this.canvasCtx.strokeStyle = this.inverted ? '#333333' : '#ffffff';
                    this.canvasCtx.lineWidth = 1;
                    this.canvasCtx.strokeRect(boxX, boxY, boxWidth, boxHeight);

                    // Draw text
                    this.canvasCtx.fillStyle = this.inverted ? '#050628' : '#ffffff';
                    this.canvasCtx.textAlign = 'center';
                    this.canvasCtx.textBaseline = 'top';

                    var quoteY = boxY + 5;
                    for (var l = 0; l < lines.length; l++) {
                        this.canvasCtx.fillText(lines[l], centerX, quoteY);
                        quoteY += 14;
                    }
                    this.canvasCtx.restore();
                }

                // Draw Active Timers HUD
                var activeStatusY = 40;
                this.canvasCtx.save();
                this.canvasCtx.font = '11px monospace';
                this.canvasCtx.fillStyle = '#666666';
                this.canvasCtx.textAlign = 'left';
                if (this.invincibleTimer > 0) {
                    this.canvasCtx.fillText('INVINCIBLE: ' + Math.ceil(this.invincibleTimer / 1000) + 's', 15, activeStatusY);
                    activeStatusY += 15;
                }
                if (this.invisibleTimer > 0) {
                    this.canvasCtx.fillText('INVISIBLE: ' + Math.ceil(this.invisibleTimer / 1000) + 's', 15, activeStatusY);
                    activeStatusY += 15;
                }
                if (this.slowTimeTimer > 0) {
                    this.canvasCtx.fillText('SLOW TIME: ' + Math.ceil(this.slowTimeTimer / 1000) + 's', 15, activeStatusY);
                    activeStatusY += 15;
                }
                if (this.doubleJumpTimer > 0) {
                    this.canvasCtx.fillText('DOUBLE JUMP: ' + Math.ceil(this.doubleJumpTimer / 1000) + 's', 15, activeStatusY);
                    activeStatusY += 15;
                }
                if (this.flutterTimer > 0) {
                    this.canvasCtx.fillText('FLUTTER: ' + Math.ceil(this.flutterTimer / 1000) + 's', 15, activeStatusY);
                    activeStatusY += 15;
                }
                if (this.laserTimer > 0) {
                    this.canvasCtx.fillText('LASER: ' + Math.ceil(this.laserTimer / 1000) + 's', 15, activeStatusY);
                    activeStatusY += 15;
                }
                if (this.tRex && this.tRex.hasShield) {
                    this.canvasCtx.fillText('SHIELD ACTIVE', 15, activeStatusY);
                }
                // Render wind streaks if wind is active
                if (this.windTimer > 0) {
                    this.renderWindLines();
                }
                this.canvasCtx.restore();

                if (playAchievementSound) {
                    this.playSound(this.soundFx.SCORE);
                    // Milestone firework burst
                    var burstX = this.dimensions.WIDTH - 60;
                    var burstY = 25;
                    var colors = isMonochromeTheme() ? ['#ffffff', '#cccccc', '#999999', '#666666'] : ['#ffcc00', '#ff3366', '#33ccff', '#33ff33'];
                    for (var f = 0; f < 30; f++) {
                        this.particles.push(new Particle(this.canvasCtx, burstX, burstY, {
                            speed: 5,
                            upward: 1,
                            size: getRandomNum(2, 4),
                            color: colors[getRandomNum(0, colors.length - 1)],
                            life: getRandomNum(500, 900),
                            isFirework: true
                        }));
                    }
                }

                // Night mode.
                if (this.invertTimer > this.config.INVERT_FADE_DURATION) {
                    this.invertTimer = 0;
                    this.invertTrigger = false;
                    this.invert();
                } else if (this.invertTimer) {
                    this.invertTimer += deltaTime;
                } else {
                    var actualDistance =
                        this.distanceMeter.getActualDistance(Math.ceil(this.distanceRan));

                    if (actualDistance > 0) {
                        this.invertTrigger = !(actualDistance %
                            this.config.INVERT_DISTANCE);

                        if (this.invertTrigger && this.invertTimer === 0) {
                            this.invertTimer += deltaTime;
                            this.invert();
                        }
                    }
                }

                // Identity Crisis: Check 1000-pt preload and 1500-pt trigger milestones
                if (actualDistance >= this.nextIdentityCrisisPreloadScore && !this.preloadedIdentity) {
                    this.preloadIdentityCrisis();
                    this.nextIdentityCrisisPreloadScore += 1500;
                }
                if (actualDistance >= this.nextIdentityCrisisScore) {
                    this.triggerIdentityCrisis();
                }

                // Render Identity Crisis banner at top of the screen
                if (this.identityCrisisDisplayTimer > 0) {
                    this.identityCrisisDisplayTimer -= deltaTime;
                    this.drawIdentityCrisisBanner();
                }

                // Render Weight of Being HUD at top center
                this.drawWeightOfBeingHUD();
            } else if (this.crashed) {
                this.clearCanvas();
                this.canvasCtx.save();
                this.canvasCtx.translate(shakeX, shakeY);
                this.drawParallax(0, 0);
                this.horizon.update(0, 0, true);
                if (this.gameOverPanel) {
                    this.gameOverPanel.draw();
                }
            }

            if (this.playing || this.crashed || (!this.activated &&
                this.tRex.blinkCount < Runner.config.MAX_BLINK_COUNT)) {
                this.tRex.update(deltaTime);
                this.scheduleNextUpdate();
                
                // Update and render active particles
                for (var p = this.particles.length - 1; p >= 0; p--) {
                    this.particles[p].update(deltaTime);
                    if (this.particles[p].life >= this.particles[p].maxLife) {
                        this.particles.splice(p, 1);
                    }
                }
            }

            // Undo the shake translate applied above - exactly one of the
            // two branches above runs save() per frame (they're mutually
            // exclusive, and a mid-frame gameOver() flips playing->crashed
            // without clearing either flag), so this always balances it.
            if (this.playing || this.crashed) {
                this.canvasCtx.restore();
            }

            // Existential visual glitch update
            if (this.glitchTimer > 0) {
                this.glitchTimer = Math.max(0, this.glitchTimer - deltaTime);
                if (this.glitchTimer === 0) {
                    this.clearGlitch();
                }
            } else {
                this.glitchCooldown -= deltaTime;
                if (this.glitchCooldown <= 0) {
                    this.triggerGlitch();
                }
            }
        },

        /**
         * Event handler.
         */
        handleEvent: function(e) {
            return (function(evtType, events) {
                switch (evtType) {
                    case events.KEYDOWN:
                    case events.MOUSEDOWN:
                        this.onKeyDown(e);
                        break;
                    case 'touchstart':
                        this.onTouchStart(e);
                        break;
                    case 'touchmove':
                        this.onTouchMove(e);
                        break;
                    case 'touchend':
                        this.onTouchEnd(e);
                        break;
                    case events.KEYUP:
                    case events.MOUSEUP:
                        this.onKeyUp(e);
                        break;
                    case events.GAMEPADCONNECTED:
                        this.onGamepadConnected(e);
                        break;
                    case events.GAMEPADDISCONNECTED:
                        this.onGamepadDisconnected(e);
                        break;
                }
            }.bind(this))(e.type, Runner.events);
        },

        onTouchStart: function(e) {
            e.preventDefault();
            var touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchStartTime = getTimeStamp();
            this.isSwiping = false;

            // Resume on mobile touch if paused
            if (this.paused && !this.crashed) {
                this.play();
                return;
            }

            // Restart on mobile tap after crash
            if (this.crashed) {
                this.restart();
                return;
            }

            // Start game / activate audio if waiting
            if (!this.playing) {
                this.loadSounds();
                this.playing = true;
                this.update();
            }

            // Normal jump or double-jump tap
            if (!this.tRex.ducking || this.tRex.isSlipping) {
                if (this.tRex.isSlipping) {
                    if (!this.tRex.jumpPending && !this.tRex.jumping) {
                        this.tRex.jumpPending = true;
                        this.tRex.jumpDelayTimer = 280;
                    }
                } else if (!this.tRex.jumping || (this.doubleJumpTimer > 0)) {
                    this.playSound(this.soundFx.BUTTON_PRESS);
                    this.tRex.startJump(this.currentSpeed);
                }
            }
        },

        onTouchMove: function(e) {
            e.preventDefault();
            if (!this.playing || this.crashed) return;

            var touch = e.touches[0];
            var deltaY = touch.clientY - this.touchStartY;

            // Swipe down: Duck or Speed Drop
            if (deltaY > 30) {
                this.isSwiping = true;
                if (this.tRex.jumping) {
                    this.tRex.setSpeedDrop();
                } else if (!this.tRex.ducking) {
                    this.tRex.setDuck(true);
                }
            }
        },

        onTouchEnd: function(e) {
            // Release duck when finger lifts
            if (this.tRex.ducking && !this.tRex.isSlipping) {
                this.tRex.setDuck(false);
                this.tRex.speedDrop = false;
            }
            if (this.isRunning() && this.tRex.jumping) {
                this.tRex.endJump();
            }
        },

        /**
         * Bind relevant key / mouse / touch listeners.
         */
        startListening: function () {
            // Keys.
            document.addEventListener(Runner.events.KEYDOWN, this);
            document.addEventListener(Runner.events.KEYUP, this);

            if (IS_MOBILE) {
                // Mobile only touch devices.
                this.touchController.addEventListener('touchstart', this);
                this.touchController.addEventListener('touchmove', this, { passive: false });
                this.touchController.addEventListener('touchend', this);
                this.containerEl.addEventListener('touchstart', this);
            } else {
                // Mouse.
                document.addEventListener(Runner.events.MOUSEDOWN, this);
                document.addEventListener(Runner.events.MOUSEUP, this);
            }

            // Gamepad. Connect/disconnect fire on window, per spec.
            if ('getGamepads' in navigator) {
                window.addEventListener(Runner.events.GAMEPADCONNECTED, this);
                window.addEventListener(Runner.events.GAMEPADDISCONNECTED, this);

                // Some browsers only fire 'gamepadconnected' for pads that
                // become active after the listener is attached. Pick up
                // any pad that was already connected (and had a button
                // pressed, per the spec) before we started listening.
                var existingPads = navigator.getGamepads();
                for (var g = 0; g < existingPads.length; g++) {
                    if (existingPads[g]) {
                        this.onGamepadConnected({ gamepad: existingPads[g] });
                        break;
                    }
                }
            }
        },

        /**
         * Remove all listeners.
         */
        stopListening: function () {
            document.removeEventListener(Runner.events.KEYDOWN, this);
            document.removeEventListener(Runner.events.KEYUP, this);

            if (IS_MOBILE) {
                this.touchController.removeEventListener(Runner.events.TOUCHSTART, this);
                this.touchController.removeEventListener(Runner.events.TOUCHEND, this);
                this.containerEl.removeEventListener(Runner.events.TOUCHSTART, this);
            } else {
                document.removeEventListener(Runner.events.MOUSEDOWN, this);
                document.removeEventListener(Runner.events.MOUSEUP, this);
            }

            if ('getGamepads' in navigator) {
                window.removeEventListener(Runner.events.GAMEPADCONNECTED, this);
                window.removeEventListener(Runner.events.GAMEPADDISCONNECTED, this);
            }
            this.gamepadPolling = false;
        },

        /**
         * Process keydown.
         * @param {Event} e
         */
        onKeyDown: function (e) {
            // Prevent native page scrolling whilst tapping on mobile.
            if (IS_MOBILE && this.playing) {
                e.preventDefault();
            }

            // Escape key toggles pause
            if (e.keyCode === 27) {
                e.preventDefault();
                if (this.playing && !this.crashed) {
                    this.stop();
                } else if (this.paused && !this.crashed) {
                    this.play();
                }
                return;
            }

            // Any click or key press resumes a paused game
            if (this.paused && !this.crashed) {
                this.play();
                return;
            }

            if (e.target != this.detailsButton) {
                if (!this.crashed && (Runner.keycodes.JUMP[e.keyCode] ||
                    e.type == Runner.events.TOUCHSTART)) {
                    if (!this.playing) {
                        this.loadSounds();
                        this.playing = true;
                        this.update();
                        if (window.errorPageController) {
                            errorPageController.trackEasterEgg();
                        }
                    }
                    // Play sound effect and jump or double-jump.
                    if (!this.tRex.ducking || this.tRex.isSlipping) {
                        if (this.tRex.isSlipping) {
                            if (!this.tRex.jumpPending && !this.tRex.jumping) {
                                this.tRex.jumpPending = true;
                                this.tRex.jumpDelayTimer = 280; // 280ms scramble delay before leaping
                            }
                        } else if (!this.tRex.jumping || (this.doubleJumpTimer > 0)) {
                            this.playSound(this.soundFx.BUTTON_PRESS);
                            this.tRex.startJump(this.currentSpeed);
                        }
                    }
                }

                if (this.crashed && e.type == Runner.events.TOUCHSTART &&
                    e.currentTarget == this.containerEl) {
                    this.restart();
                }
            }

            if (this.playing && !this.crashed && Runner.keycodes.DUCK[e.keyCode]) {
                e.preventDefault();
                if (this.tRex.jumping) {
                    // Speed drop, activated only when jump key is not pressed.
                    this.tRex.setSpeedDrop();
                } else if (!this.tRex.jumping && !this.tRex.ducking) {
                    // Duck.
                    this.tRex.setDuck(true);
                }
            }
        },


        /**
         * Process key up.
         * @param {Event} e
         */
        onKeyUp: function (e) {
            var keyCode = String(e.keyCode);
            var isjumpKey = Runner.keycodes.JUMP[keyCode] ||
                e.type == Runner.events.TOUCHEND ||
                e.type == Runner.events.MOUSEDOWN;

            if (this.crashed) {
                // Check that enough time has elapsed before allowing jump key to restart
                var deltaTime = getTimeStamp() - (this.crashedTime || this.time);

                if (Runner.keycodes.RESTART[keyCode] || this.isLeftClickOnCanvas(e) ||
                    (deltaTime >= this.config.GAMEOVER_CLEAR_TIME &&
                        Runner.keycodes.JUMP[keyCode])) {
                    this.restart();
                }
            } else if (this.isRunning() && isjumpKey) {
                this.tRex.endJump();
            } else if (Runner.keycodes.DUCK[keyCode]) {
                this.tRex.speedDrop = false;
                if (!this.tRex.isSlipping) {
                    this.tRex.setDuck(false);
                }
            } else if (this.paused && isjumpKey) {
                // Reset the jump state
                this.tRex.reset();
                this.play();
            }
        },

        /**
         * Returns whether the event was a left click on canvas.
         * On Windows right click is registered as a click.
         * @param {Event} e
         * @return {boolean}
         */
        isLeftClickOnCanvas: function (e) {
            return e.button != null && e.button < 2 &&
                e.type == Runner.events.MOUSEUP && e.target == this.canvas;
        },

        /**
         * A gamepad became available. Start polling it; the Gamepad API
         * has no button press/release events, only a point-in-time
         * snapshot via navigator.getGamepads(), so state has to be
         * diffed frame to frame (see pollGamepad).
         * @param {GamepadEvent|{gamepad: Gamepad}} e
         */
        onGamepadConnected: function (e) {
            this.gamepadIndex = e.gamepad.index;
            this.previousGamepadState = { jump: false, duck: false, pause: false };

            if (!this.gamepadPolling) {
                this.gamepadPolling = true;
                this.pollGamepad();
            }
        },

        /**
         * A gamepad was unplugged or lost its connection.
         * @param {GamepadEvent} e
         */
        onGamepadDisconnected: function (e) {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
                this.previousGamepadState = null;
                this.gamepadPolling = false;
            }
        },

        /**
         * Poll the active gamepad once per animation frame and translate
         * button edges into the same keydown/keyup events the keyboard
         * uses, so jump, duck, pause and restart all reuse the existing
         * handlers instead of duplicating game-state logic. This runs on
         * its own rAF loop, independent of scheduleNextUpdate, because
         * the main update loop stops scheduling frames once the idle
         * T-Rex finishes its blink cycle while waiting for the player to
         * start - polling still needs to run so a button press can wake
         * the game back up.
         */
        pollGamepad: function () {
            if (!this.gamepadPolling || this.gamepadIndex === null) {
                return;
            }

            var pads = navigator.getGamepads ? navigator.getGamepads() : [];
            var pad = pads[this.gamepadIndex];

            if (pad) {
                var prev = this.previousGamepadState;

                // Any face button (A/B/X/Y, indices 0-3 on the standard
                // mapping) jumps, confirms, and restarts after a crash.
                var jumpPressed = false;
                for (var i = 0; i < 4 && i < pad.buttons.length; i++) {
                    if (pad.buttons[i] && pad.buttons[i].pressed) {
                        jumpPressed = true;
                        break;
                    }
                }

                // D-pad down (button 13) or the left stick pulled down ducks.
                var duckPressed = !!(pad.buttons[13] && pad.buttons[13].pressed) ||
                    (pad.axes.length > 1 && pad.axes[1] > 0.5);

                // Start/Options (button 9) pauses/resumes, like Escape.
                var pausePressed = !!(pad.buttons[9] && pad.buttons[9].pressed);

                this.fireGamepadKey(32, jumpPressed, prev.jump);
                this.fireGamepadKey(40, duckPressed, prev.duck);

                if (pausePressed && !prev.pause) {
                    this.onKeyDown({
                        keyCode: 27,
                        type: Runner.events.KEYDOWN,
                        preventDefault: function () {},
                        target: null
                    });
                }

                prev.jump = jumpPressed;
                prev.duck = duckPressed;
                prev.pause = pausePressed;
            }

            requestAnimationFrame(this.boundPollGamepad);
        },

        /**
         * Synthesize a keydown (on press) or keyup (on release) for a
         * gamepad button edge, using the spacebar/down-arrow keycodes so
         * the input flows through the real onKeyDown/onKeyUp handlers.
         * @param {number} keyCode
         * @param {boolean} isPressed Current frame's button state.
         * @param {boolean} wasPressed Previous frame's button state.
         */
        fireGamepadKey: function (keyCode, isPressed, wasPressed) {
            if (isPressed === wasPressed) {
                return;
            }
            var fakeEvent = {
                keyCode: keyCode,
                type: isPressed ? Runner.events.KEYDOWN : Runner.events.KEYUP,
                preventDefault: function () {},
                target: null
            };
            if (isPressed) {
                this.onKeyDown(fakeEvent);
            } else {
                this.onKeyUp(fakeEvent);
            }
        },

        /**
         * RequestAnimationFrame wrapper.
         */
        scheduleNextUpdate: function () {
            if (!this.updatePending) {
                this.updatePending = true;
                this.raqId = requestAnimationFrame(this.update.bind(this));
            }
        },

        /**
         * Check collision between player and collectible bonus.
         */
        checkBonusCollision: function (bonus, tRex) {
            var tRexBox = new CollisionBox(
                tRex.xPos + 1, tRex.yPos + 1,
                tRex.config.WIDTH - 2, tRex.config.HEIGHT - 2);
            var bonusBox = new CollisionBox(
                bonus.xPos, bonus.yPos,
                bonus.width, bonus.height);
            return boxCompare(tRexBox, bonusBox);
        },

        /**
         * Whether the game is running.
         * @return {boolean}
         */
        isRunning: function () {
            return !!this.raqId;
        },

        /**
         * Game over state.
         */
        gameOver: function () {
            this.playSound(this.soundFx.HIT);
            vibrate(200);

            this.playing = false;
            this.crashed = true;
            this.distanceMeter.acheivement = false;
			this.clearGlitch();

            // Screen shake & death debris particles
            this.shakeTimer = 400;
            this.shakeIntensity = 6;
            for (var d = 0; d < 25; d++) {
                this.particles.push(new Particle(this.canvasCtx, this.tRex.xPos + 22, this.tRex.yPos + 23, {
                    speed: 7,
                    upward: 3,
                    size: getRandomNum(3, 6),
                    color: isMonochromeTheme() ? '#888888' : '#ff3333',
                    life: getRandomNum(400, 800)
                }));
            }
			
            if (this.windAudio) {
                this.windAudio.pause();
                this.windAudio.currentTime = 0;
            }
            this.windTimer = 0;
            this.windLines = [];

            // Clear and redraw background once upon dying, then let update loop handle death frames
            this.clearCanvas();
			this.drawParallax(0, 0);
            this.horizon.update(0, 0, true);
            this.tRex.update(100, Trex.status.CRASHED);

            // Game over panel.
            if (!this.gameOverPanel) {
                this.gameOverPanel = new GameOverPanel(this.canvas,
                    this.spriteDef.TEXT_SPRITE, this.spriteDef.RESTART,
                    this.dimensions);
            } else {
                this.gameOverPanel.draw();
            }

            // Update the high score.
            if (this.distanceRan > this.highestScore) {
                this.highestScore = Math.ceil(this.distanceRan);
                this.distanceMeter.setHighScore(this.highestScore);
            }

            // Reset the time clock.
            this.time = getTimeStamp();
			this.crashedTime = getTimeStamp();
            this.isOnIce = false;
            if (this.tRex) {
                this.tRex.isSlipping = false;
                this.tRex.jumpPending = false;
                this.tRex.jumpDelayTimer = 0;
            }
            this.identityCrisisDisplayTimer = 0;
            this.preloadedIdentity = null;
        },

        stop: function () {
            this.playing = false;
            this.paused = true;
			this.clearGlitch();
            cancelAnimationFrame(this.raqId);
            this.raqId = 0;
            if (this.windAudio) {
                this.windAudio.pause();
            }
            this.drawPauseScreen();
        },

        play: function () {
            if (!this.crashed && this.paused) {
                this.playing = true;
                this.paused = false;
                if (!this.tRex.jumping && !this.tRex.ducking) {
                    this.tRex.update(0, Trex.status.RUNNING);
                }
                this.time = getTimeStamp();
                if (this.windAudio && this.windTimer > 0) {
                    this.windAudio.play().catch(function () {});
                }
                this.update();
            }
        },

        restart: function () {
            if (!this.playing) {
                if (Runner.isRandomTheme) {
                    this.initRandomTheme();
                    if (this.bonusImage && Runner.randomBonusTheme) {
                        this.bonusImage.src = './assets/' + Runner.randomBonusTheme + '_200_percent/bonus.png';
                    }
                    if (this.parallaxImage && Runner.randomBonusTheme) {
                        this.parallaxImage.src = './assets/' + Runner.randomBonusTheme + '_200_percent/parallax.png';
                    }
                    this.updateSoundFx();
                }
                if (this.raqId) {
                    cancelAnimationFrame(this.raqId);
                    this.raqId = 0;
                }
                this.playCount++;
                this.runningTime = 0;
                this.playing = true;
                this.crashed = false;
                this.distanceRan = 0;
                this.setSpeed(this.config.SPEED);
                this.time = getTimeStamp();
                this.containerEl.classList.remove(Runner.classes.CRASHED);
                this.parallaxX = 0;
                this.clearCanvas();
                this.drawParallax(0, 0);
                this.distanceMeter.reset(this.highestScore);
                this.horizon.reset();
                this.tRex.reset(this.tRex.defaultGroundY);
                this.bonusItem = null;
                this.nextBonusScore = getRandomNum(100, 250);
                this.particles = [];
                if (this.windAudio) {
                    this.windAudio.pause();
                    this.windAudio.currentTime = 0;
                }
                this.windTimer = 0;
                this.windLines = [];
                this.windCooldown = getRandomNum(15000, 30000);
                this.shakeTimer = 0;
				this.crashedTime = 0;
                this.invincibleTimer = 0;
                this.invisibleTimer = 0;
                this.slowTimeTimer = 0;
                this.doubleJumpTimer = 0;
                this.flutterTimer = 0;
                this.laserTimer = 0;
                this.shieldInvulnerableTimer = 0;
                this.activePowerUpName = '';
                this.activePowerUpTimer = 0;
                this.quoteTimer = 0;
                this.quoteInitialPlayed = false;
                this.currentQuoteText = '';
                this.currentQuoteDisplayTimer = 0;
                if (this.tRex) {
                    this.tRex.hasShield = false;
                }
                this.playSound(this.soundFx.BUTTON_PRESS);
                this.invert(true);
                this.isOnIce = false;
                this.clearGlitch();
                this.glitchCooldown = getRandomNum(5000, 22000);
                this.nextIdentityCrisisScore = 1500;
                this.nextIdentityCrisisPreloadScore = 1000;
                this.preloadedIdentity = null;
                this.identityCrisisDisplayTimer = 0;
                this.identityCrisisThemeName = '';
                this.dreadLevel = 0;
                this.updateWeightOfBeing();
                if (this.tRex) {
                    this.tRex.isSlipping = false;
                    this.tRex.jumpPending = false;
                    this.tRex.jumpDelayTimer = 0;
                }
                this.update();
            }
        },
        
        /**
         * Hides offline messaging for a fullscreen game only experience.
         */
        setArcadeMode() {
            document.body.classList.add(Runner.classes.ARCADE_MODE);
            this.setArcadeModeContainerScale();
        },

        /**
         * Sets the scaling for arcade mode.
         */
        setArcadeModeContainerScale() {
            const windowHeight = window.innerHeight;
            const scaleHeight = windowHeight / this.dimensions.HEIGHT;
            const scaleWidth = window.innerWidth / this.dimensions.WIDTH;
            const scale = Math.max(1, Math.min(scaleHeight, scaleWidth));
            const scaledCanvasHeight = this.dimensions.HEIGHT * scale;
            // Positions the game container at 10% of the available vertical window
            // height minus the game container height.
            const translateY = Math.ceil(Math.max(0, (windowHeight - scaledCanvasHeight -
                                                      Runner.config.ARCADE_MODE_INITIAL_TOP_POSITION) *
                                                  Runner.config.ARCADE_MODE_TOP_POSITION_PERCENT)) *
                  window.devicePixelRatio;

            const cssScale = scale;
            this.containerEl.style.transform =
                'scale(' + cssScale + ') translateY(' + translateY + 'px)';
        },
        
        /**
         * Pause the game if the tab is not in focus.
         */
        onVisibilityChange: function (e) {
            if (document.hidden || document.webkitHidden || e.type == 'blur' ||
                document.visibilityState != 'visible') {
                if (this.playing && !this.crashed) {
                    this.stop();
                }
            }
        },

        /**
         * Play a sound.
         * @param {SoundBuffer} soundBuffer
         */
        playSound: function (soundBuffer) {
            if (soundBuffer) {
                var sourceNode = this.audioContext.createBufferSource();
                sourceNode.buffer = soundBuffer;
                sourceNode.connect(this.audioContext.destination);
                sourceNode.start(0);
            }
        },

        /**
         * Inverts the current page / canvas colors.
         * @param {boolean} Whether to reset colors.
         */
        invert: function (reset) {
            if (reset) {
                document.body.classList.toggle(Runner.classes.INVERTED, false);
                this.invertTimer = 0;
                this.inverted = false;
            } else {
                this.inverted = document.body.classList.toggle(Runner.classes.INVERTED,
                    this.invertTrigger);
            }
        },

        /**
         * Trigger a 4-second wind gust.
         */
        startWindGust: function () {
            this.windTimer = 4000;
            this.windCooldown = getRandomNum(20000, 40000); // Next gust interval
            if (this.windAudio) {
                this.windAudio.currentTime = 0;
                this.windAudio.play().catch(function () {
                    // Handled if browser restricts playback before interaction
                });
            }
        },

        /**
         * Draw animated wind streaks blowing right to left across the canvas.
         */
        renderWindLines: function () {
            // Keep a pool of active wind line streaks
            while (this.windLines.length < 18) {
                this.windLines.push({
                    x: this.dimensions.WIDTH + getRandomNum(10, 150),
                    y: getRandomNum(15, this.dimensions.HEIGHT - 30),
                    length: getRandomNum(35, 90),
                    speed: getRandomNum(9, 16),
                    opacity: (getRandomNum(25, 65) / 100)
                });
            }

            this.canvasCtx.save();
            var strokeColor = this.inverted ? '0, 0, 0' : '220, 235, 255';

            for (var i = this.windLines.length - 1; i >= 0; i--) {
                var line = this.windLines[i];
                line.x -= line.speed;

                this.canvasCtx.strokeStyle = 'rgba(' + strokeColor + ', ' + line.opacity + ')';
                this.canvasCtx.lineWidth = 1.5;
                this.canvasCtx.beginPath();
                this.canvasCtx.moveTo(line.x, line.y);
                this.canvasCtx.lineTo(line.x + line.length, line.y - 1.5); // Slight gust angle
                this.canvasCtx.stroke();

                // Remove when off-screen to the left
                if (line.x + line.length < 0) {
                    this.windLines.splice(i, 1);
                }
            }
            this.canvasCtx.restore();
        },

        /**
         * Render the pause overlay and center the pause graphic scaled to 60% canvas width.
         */
        drawPauseScreen: function () {
            if (!this.canvasCtx) {
                return;
            }

            var canvasWidth = this.dimensions.WIDTH;
            var canvasHeight = this.dimensions.HEIGHT;
            var img = Runner.pauseImage;

            // Target 60% of the canvas width
            var targetWidth = canvasWidth * 0.6;
            var targetHeight = targetWidth * 0.25;

            if (img && img.complete && img.naturalWidth > 0) {
                targetHeight = targetWidth * (img.naturalHeight / img.naturalWidth);
            }

            // Prevent vertical overflow on short/landscape displays
            if (targetHeight > canvasHeight * 0.75) {
                targetHeight = canvasHeight * 0.75;
                if (img && img.complete && img.naturalWidth > 0) {
                    targetWidth = targetHeight * (img.naturalWidth / img.naturalHeight);
                }
            }

            var x = Math.round((canvasWidth - targetWidth) / 2);
            var y = Math.round((canvasHeight - targetHeight) / 2);

            this.canvasCtx.save();
            // Darkened scrim overlay for contrast across any theme
            this.canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);

            if (img && img.complete && img.naturalWidth > 0) {
                this.canvasCtx.drawImage(img, x, y, targetWidth, targetHeight);
            } else {
                var self = this;
                img.onload = function () {
                    if (self.paused) {
                        self.drawPauseScreen();
                    }
                };
                // Fallback indicator while the asset loads
                this.canvasCtx.font = 'bold 20px monospace';
                this.canvasCtx.fillStyle = '#ffffff';
                this.canvasCtx.textAlign = 'center';
                this.canvasCtx.textBaseline = 'middle';
                this.canvasCtx.fillText('PAUSED', canvasWidth / 2, canvasHeight / 2);
            }
            this.canvasCtx.restore();
        },

        /**
         * Update and draw the looping parallax background at half the speed of the ground.
         * @param {number} deltaTime
         * @param {number} speed
         */
        drawParallax: function (deltaTime, speed) {
            if (!this.parallaxImage || !this.parallaxImage.complete || this.parallaxImage.naturalWidth === 0) {
                return;
            }
        
            var bgHeight = this.dimensions.HEIGHT; // 250px
            var imgW = this.parallaxImage.naturalWidth || 600;
            var imgH = this.parallaxImage.naturalHeight || 250;
            var bgWidth = Math.round(imgW * (bgHeight / imgH)) || this.dimensions.WIDTH;
        
            // Advance position leftward at 1/4 (0.25x) of ground speed
            if (deltaTime && speed) {
                this.parallaxX -= (speed * 0.25 * (FPS / 1000)) * deltaTime;
                if (this.parallaxX <= -bgWidth) {
                    this.parallaxX %= bgWidth;
                }
            }
        
            this.canvasCtx.save();
            if (isMonochromeTheme()) {
                this.canvasCtx.filter = 'grayscale(100%)';
            }
        
            // Determine starting offset and tile across the full canvas width
            var startX = Math.floor(this.parallaxX);
            while (startX > 0) {
                startX -= bgWidth;
            }
        
            for (var x = startX; x < this.dimensions.WIDTH; x += bgWidth) {
                this.canvasCtx.drawImage(this.parallaxImage, x, 0, bgWidth, bgHeight);
            }
            this.canvasCtx.restore();
		},

        /**
         * Trigger a brief, random visual glitch on the canvas.
         */
        triggerGlitch: function () {
            if (this.activeGlitchClass || !this.canvas || !this.playing || this.paused) {
                return;
            }
            var glitches = ['glitch-chromatic', 'glitch-tear', 'glitch-vhs', 'glitch-shake'];
            this.activeGlitchClass = glitches[getRandomNum(0, glitches.length - 1)];
            this.canvas.classList.add(this.activeGlitchClass);

            // Lasts 180ms to 380ms for an uncanny, fleeting stutter
            this.glitchTimer = getRandomNum(180, 380);
            this.glitchCooldown = getRandomNum(5000, 22000);
        },

        /**
         * Remove any active glitch styling from the canvas.
         */
        clearGlitch: function () {
            if (this.activeGlitchClass && this.canvas) {
                this.canvas.classList.remove(this.activeGlitchClass);
                this.activeGlitchClass = '';
            }
            this.glitchTimer = 0;
        },

        /**
         * Returns a list of candidate theme keys (excluding 'random').
         * @return {Array<string>}
         */
        getCandidateThemes: function () {
            var themesObj = window.THEMES || window.themes || (typeof THEMES !== 'undefined' ? THEMES : null);
            if (themesObj) {
                return Object.keys(themesObj).filter(function (key) {
                    return key !== 'random';
                });
            }
            return ['color', 'batman', 'covid', 'mario', 'sonic', 'zelda', 'dina', 'cow'];
        },

        /**
         * Preload the next theme assets at the 1000-pt interval for seamless mid-stride swapping.
         */
        preloadIdentityCrisis: function () {
            var candidates = this.getCandidateThemes();
            var self = this;
            var available = candidates.filter(function (k) { return k !== self.currentTheme; });
            if (available.length === 0) available = candidates;

            var nextTheme = available[Math.floor(Math.random() * available.length)];
            var themesObj = window.THEMES || window.themes || (typeof THEMES !== 'undefined' ? THEMES : null);
            var themeData = themesObj ? themesObj[nextTheme] : null;

            var spriteSrc = '';
            if (themeData) {
                spriteSrc = IS_HIDPI ? themeData.sprite2x : themeData.sprite1x;
            } else {
                spriteSrc = IS_HIDPI ?
                    'assets/' + nextTheme + '_200_percent/200-offline-sprite.png' :
                    'assets/' + nextTheme + '_100_percent/100-offline-sprite.png';
            }

            var preloadedSprite = new Image();
            preloadedSprite.src = spriteSrc;

            var preloadedParallax = new Image();
            preloadedParallax.src = './assets/' + nextTheme + '_200_percent/parallax.png';

            var preloadedBonus = new Image();
            preloadedBonus.src = './assets/' + nextTheme + '_200_percent/bonus.png';

            this.preloadedIdentity = {
                themeKey: nextTheme,
                themeTitle: (themeData && themeData.footerTitle) ? themeData.footerTitle : nextTheme.toUpperCase(),
                sprite: preloadedSprite,
                parallax: preloadedParallax,
                bonus: preloadedBonus
            };
        },

        /**
         * Dynamically swap the theme assets mid-run without resetting momentum or entities.
         */
        triggerIdentityCrisis: function () {
            if (!this.preloadedIdentity) {
                this.preloadIdentityCrisis();
            }

            var identity = this.preloadedIdentity;
            this.currentTheme = identity.themeKey;

            // 1. Swap main sprite sheet
            Runner.imageSprite = identity.sprite;

            // 2. Swap parallax background & bonus asset
            this.parallaxImage = identity.parallax;
            this.bonusImage = identity.bonus;

            // 3. Update theme stylesheet (background color & page styling)
            var themesObj = window.THEMES || window.themes || (typeof THEMES !== 'undefined' ? THEMES : null);
            var themeLink = document.getElementById('theme-stylesheet');
            if (themeLink && themesObj && themesObj[this.currentTheme] && themesObj[this.currentTheme].css) {
                themeLink.href = themesObj[this.currentTheme].css;
            }

            // 4. Update audio effects
            if (Runner.isRandomTheme) {
                this.initRandomTheme();
            } else {
                this.updateSoundFx();
            }

            // 5. Trigger intentional screen-tear reality glitch
            this.clearGlitch();
            this.activeGlitchClass = 'glitch-tear';
            this.canvas.classList.add('glitch-tear');
            this.glitchTimer = 320;

            // 6. Activate Announcement Banner
            this.identityCrisisThemeName = identity.themeTitle;
            this.identityCrisisDisplayTimer = 3500;

            // 7. Schedule next 1500-pt checkpoint
            this.nextIdentityCrisisScore += 1500;
            this.preloadedIdentity = null;
        },

        /**
         * Render the "IDENTITY CRISIS" announcement banner at the top of the canvas.
         */
        drawIdentityCrisisBanner: function () {
            var ctx = this.canvasCtx;
            var width = this.dimensions.WIDTH;
            var text = "IDENTITY CRISIS: " + this.identityCrisisThemeName.toUpperCase();

            ctx.save();
            ctx.font = 'bold 12px monospace';
            var textMetrics = ctx.measureText(text);
            var boxW = textMetrics.width + 24;
            var boxH = 26;
            var boxX = (width - boxW) / 2;
            var boxY = 6;

            // High-contrast neon glitch banner
            ctx.fillStyle = this.inverted ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 10, 25, 0.92)';
            ctx.fillRect(boxX, boxY, boxW, boxH);

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = this.inverted ? '#990022' : '#00ffff';
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            // Text
            ctx.fillStyle = this.inverted ? '#990022' : '#ff0055';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, width / 2, boxY + (boxH / 2));
            ctx.restore();
        },

        /**
         * Recalculate T-Rex gravity and jump velocity based on the Dread Meter.
         */
        updateWeightOfBeing: function () {
            if (!this.tRex) return;
            var dreadRatio = this.dreadLevel / 100;

            // Scale gravity up from 0.60 to 1.00 (making falls sharp and heavy)
            this.tRex.config.GRAVITY = Trex.config.GRAVITY + (dreadRatio * 0.40);

            // Slightly increase initial impulse so jumps remain snappy and clearable
            this.tRex.config.INIITAL_JUMP_VELOCITY = Trex.config.INIITAL_JUMP_VELOCITY - (dreadRatio * 1.8);
            this.tRex.config.DROP_VELOCITY = this.tRex.config.INIITAL_JUMP_VELOCITY / 2;
        },

        /**
         * Render the "WEIGHT OF BEING" HUD bar at the top center of the screen.
         */
        drawWeightOfBeingHUD: function () {
            var ctx = this.canvasCtx;
            var width = this.dimensions.WIDTH;

            var barW = 170;
            var barH = 14;
            var x = (width - barW) / 2;
            // Shift down if the Identity Crisis banner is currently active
            var y = (this.identityCrisisDisplayTimer > 0) ? 36 : 6;

            ctx.save();

            // Background container pill
            ctx.fillStyle = this.inverted ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 15, 20, 0.85)';
            ctx.fillRect(x, y, barW, barH);

            // Border
            ctx.strokeStyle = this.inverted ? '#333333' : 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, barW, barH);

            // Fill gauge
            var gaugeW = Math.round((barW - 4) * (this.dreadLevel / 100));
            if (gaugeW > 0) {
                // Color transitions: calm blue (low) -> amber (mid) -> existential red (high)
                var gaugeColor = '#00e5ff';
                if (this.dreadLevel > 70) {
                    gaugeColor = '#ff1744';
                } else if (this.dreadLevel > 35) {
                    gaugeColor = '#ffb700';
                }
                ctx.fillStyle = gaugeColor;
                ctx.fillRect(x + 2, y + 2, gaugeW, barH - 4);
            }

            // HUD label & percentage
            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = (this.dreadLevel > 50 && !this.inverted) ? '#ffffff' : (this.inverted ? '#000000' : '#cccccc');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('WEIGHT OF BEING ' + this.dreadLevel + '%', width / 2, y + (barH / 2));

            ctx.restore();
        },
    };

    /**
     * The 10 distinct sprite portions to randomize.
     */
    Runner.RANDOM_SPRITE_PARTS = [
        'CACTUS_LARGE',
        'CACTUS_SMALL',
        'CLOUD',
        'HORIZON',
        'MOON',
        'PTERODACTYL',
        'RESTART',
        'TEXT_SPRITE',
        'TREX',
        'STAR'
    ];
    
    Runner.themeImageCache = {};
    Runner.randomSpriteImages = {};
    Runner.isRandomTheme = false;
    Runner.soundBufferCache = {};
    Runner.randomSoundThemes = {};
    
    Runner.SOUND_KEYS = {
        BUTTON_PRESS: 'press',
        HIT: 'hit',
        SCORE: 'reached'
    };
    
    /**
     * Returns the appropriate sprite sheet image for a given sprite component.
     * @param {string} partKey
     * @return {HTMLImageElement|HTMLCanvasElement}
     */
    Runner.getSpriteImage = function (partKey) {
        if (Runner.isRandomTheme && Runner.randomSpriteImages && Runner.randomSpriteImages[partKey]) {
            var img = Runner.randomSpriteImages[partKey];
            if (img.complete && img.naturalWidth > 0) {
                return img;
            }
        }
        return Runner.imageSprite;
    };

    Runner.prototype.initRandomTheme = function () {
        var themesObj = window.THEMES || window.themes || (typeof THEMES !== 'undefined' ? THEMES : null);
        var candidateThemes = [];
    
        if (themesObj) {
            candidateThemes = Object.keys(themesObj).filter(function (key) {
                return key !== 'random';
            });
        }
    
        if (candidateThemes.length === 0) {
            candidateThemes = ['color', 'batman', 'covid'];
        }
    
        // Shuffle candidate themes (Fisher-Yates)
        var shuffled = candidateThemes.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
    
        // Assign each of the 10 parts to different themes
        Runner.randomSpriteImages = {};
        for (var k = 0; k < Runner.RANDOM_SPRITE_PARTS.length; k++) {
            var partKey = Runner.RANDOM_SPRITE_PARTS[k];
            var themeName = (k < shuffled.length) ?
                shuffled[k] :
                candidateThemes[Math.floor(Math.random() * candidateThemes.length)];
    
            var themeData = themesObj && themesObj[themeName];
            var src = '';
            if (themeData) {
                src = themeData.sprite2x;
            } else {
                src = 'assets/' + themeName + '_200_percent/200-offline-sprite.png';
            }
    
            // Preload and cache
            if (!Runner.themeImageCache[src]) {
                var img = new Image();
                img.src = src;
                Runner.themeImageCache[src] = img;
            }
            Runner.randomSpriteImages[partKey] = Runner.themeImageCache[src];
        }
    
        // Select random theme for bonus collectible asset
        Runner.randomBonusTheme = candidateThemes[Math.floor(Math.random() * candidateThemes.length)];

        // Assign random themes for sounds (BUTTON_PRESS, HIT, SCORE)
        var soundThemes = candidateThemes.filter(function (key) {
            return themesObj && themesObj[key] && themesObj[key].sounds;
        });
        if (soundThemes.length === 0) {
            soundThemes = candidateThemes;
        }
	    
        // Shuffle sound candidate themes so each effect can come from a different theme
        var shuffledSoundThemes = soundThemes.slice();
        for (var s = shuffledSoundThemes.length - 1; s > 0; s--) {
            var r = Math.floor(Math.random() * (s + 1));
            var tmpSound = shuffledSoundThemes[s];
            shuffledSoundThemes[s] = shuffledSoundThemes[r];
            shuffledSoundThemes[r] = tmpSound;
        }
	    
        Runner.randomSoundThemes = {
            BUTTON_PRESS: shuffledSoundThemes[0 % shuffledSoundThemes.length],
            HIT: shuffledSoundThemes[1 % shuffledSoundThemes.length],
            SCORE: shuffledSoundThemes[2 % shuffledSoundThemes.length]
        };
    };

    /**
     * Updates the canvas size taking into
     * account the backing store pixel ratio and
     * the device pixel ratio.
     *
     * See article by Paul Lewis:
     * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
     *
     * @param {HTMLCanvasElement} canvas
     * @param {number} opt_width
     * @param {number} opt_height
     * @return {boolean} Whether the canvas was scaled.
     */
    Runner.updateCanvasScaling = function (canvas, opt_width, opt_height) {
        var context = canvas.getContext('2d');

        // Query the various pixel ratios
        var devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
        var backingStoreRatio = Math.floor(context.webkitBackingStorePixelRatio) || 1;
        var ratio = devicePixelRatio / backingStoreRatio;

        // Upscale the canvas if the two ratios don't match
        if (devicePixelRatio !== backingStoreRatio) {
            var oldWidth = opt_width || canvas.width;
            var oldHeight = opt_height || canvas.height;

            canvas.width = oldWidth * ratio;
            canvas.height = oldHeight * ratio;

            canvas.style.width = oldWidth + 'px';
            canvas.style.height = oldHeight + 'px';

            // Scale the context to counter the fact that we've manually scaled
            // our canvas element.
            context.scale(ratio, ratio);
            return true;
        } else if (devicePixelRatio == 1) {
            // Reset the canvas width / height. Fixes scaling bug when the page is
            // zoomed and the devicePixelRatio changes accordingly.
            canvas.style.width = canvas.width + 'px';
            canvas.style.height = canvas.height + 'px';
        }
        return false;
    };


    /**
     * Get random number.
     * @param {number} min
     * @param {number} max
     * @param {number}
     */
    function getRandomNum(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    /**
     * Check if the active theme is monochrome.
     * @return {boolean}
     */
    function isMonochromeTheme() {
        var params = new URLSearchParams(window.location.search);
        var activeTheme = params.get('theme') || localStorage.getItem('dino_theme') || 'color';
        if (activeTheme === 'random') {
            return false;
        }
        if (window.themes && window.themes[activeTheme]) {
            var mono = window.themes[activeTheme].monochrome;
            return mono === "true" || mono === true;
        }
        var fallbackMonochrome = ['light', 'kitty', 'kumamon', 'lacrosse'];
        return fallbackMonochrome.indexOf(activeTheme) !== -1;
    }


    /**
     * Vibrate on mobile devices.
     * @param {number} duration Duration of the vibration in milliseconds.
     */
    function vibrate(duration) {
        if (IS_MOBILE && window.navigator.vibrate) {
            window.navigator.vibrate(duration);
        }
    }


    /**
     * Create canvas element.
     * @param {HTMLElement} container Element to append canvas to.
     * @param {number} width
     * @param {number} height
     * @param {string} opt_classname
     * @return {HTMLCanvasElement}
     */
    function createCanvas(container, width, height, opt_classname) {
        var canvas = document.createElement('canvas');
        canvas.className = opt_classname ? Runner.classes.CANVAS + ' ' +
            opt_classname : Runner.classes.CANVAS;
        canvas.width = width;
        canvas.height = height;
        container.appendChild(canvas);

        return canvas;
    }


    /**
     * Decodes the base 64 audio to ArrayBuffer used by Web Audio.
     * @param {string} base64String
     */
    function decodeBase64ToArrayBuffer(base64String) {
        var len = (base64String.length / 4) * 3;
        var str = atob(base64String);
        var arrayBuffer = new ArrayBuffer(len);
        var bytes = new Uint8Array(arrayBuffer);

        for (var i = 0; i < len; i++) {
            bytes[i] = str.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Return the current timestamp.
     * @return {number}
     */
    function getTimeStamp() {
        return IS_IOS ? new Date().getTime() : performance.now();
    }

    //******************************************************************************

    /**
     * Game over panel.
     * @param {!HTMLCanvasElement} canvas
     * @param {Object} textImgPos
     * @param {Object} restartImgPos
     * @param {!Object} dimensions Canvas dimensions.
     * @constructor
     */
    function GameOverPanel(canvas, textImgPos, restartImgPos, dimensions) {
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.canvasDimensions = dimensions;
        this.textImgPos = textImgPos;
        this.restartImgPos = restartImgPos;
        this.draw();
    };


    /**
     * Dimensions used in the panel.
     * @enum {number}
     */
    GameOverPanel.dimensions = {
        TEXT_X: 0,
        TEXT_Y: 13,
        TEXT_WIDTH: 191,
        TEXT_HEIGHT: 11,
        RESTART_WIDTH: 36,
        RESTART_HEIGHT: 32
    };


    GameOverPanel.prototype = {
        /**
         * Update the panel dimensions.
         * @param {number} width New canvas width.
         * @param {number} opt_height Optional new canvas height.
         */
        updateDimensions: function (width, opt_height) {
            this.canvasDimensions.WIDTH = width;
            if (opt_height) {
                this.canvasDimensions.HEIGHT = opt_height;
            }
        },

        /**
         * Draw the panel.
         */
        draw: function () {
            var dimensions = GameOverPanel.dimensions;

            var centerX = this.canvasDimensions.WIDTH / 2;

            // Game over text.
            var textSourceX = dimensions.TEXT_X;
            var textSourceY = dimensions.TEXT_Y;
            var textSourceWidth = dimensions.TEXT_WIDTH;
            var textSourceHeight = dimensions.TEXT_HEIGHT;

            var textTargetX = Math.round(centerX - (dimensions.TEXT_WIDTH / 2));
            var textTargetY = Math.round((this.canvasDimensions.HEIGHT - 25) / 3);
            var textTargetWidth = dimensions.TEXT_WIDTH;
            var textTargetHeight = dimensions.TEXT_HEIGHT;

            var restartSourceWidth = dimensions.RESTART_WIDTH;
            var restartSourceHeight = dimensions.RESTART_HEIGHT;
            var restartTargetX = centerX - (dimensions.RESTART_WIDTH / 2);
            var restartTargetY = this.canvasDimensions.HEIGHT / 2;

            textSourceY *= 2;
            textSourceX *= 2;
            textSourceWidth *= 2;
            textSourceHeight *= 2;
            restartSourceWidth *= 2;
            restartSourceHeight *= 2;

            textSourceX += this.textImgPos.x;
            textSourceY += this.textImgPos.y;

            // Game over text from sprite.
            this.canvasCtx.drawImage(Runner.getSpriteImage('TEXT_SPRITE'),
                textSourceX, textSourceY, textSourceWidth, textSourceHeight,
                textTargetX, textTargetY, textTargetWidth, textTargetHeight);
            
            // Restart button.
            this.canvasCtx.drawImage(Runner.getSpriteImage('RESTART'),
                this.restartImgPos.x, this.restartImgPos.y,
                restartSourceWidth, restartSourceHeight,
                restartTargetX, restartTargetY, dimensions.RESTART_WIDTH,
                dimensions.RESTART_HEIGHT);
        }
    };


    //******************************************************************************

    /**
     * Check for a collision.
     * Purely reports what would happen - it never mutates tRex or Runner
     * state. In particular, a hit that a shield would absorb is reported
     * back as the string 'shielded' rather than being consumed here;
     * the caller (Runner.prototype.update) is responsible for actually
     * clearing tRex.hasShield and starting the post-hit grace period.
     * @param {!Obstacle} obstacle
     * @param {!Trex} tRex T-rex object.
     * @param {HTMLCanvasContext} opt_canvasCtx Optional canvas context for drawing
     *    collision boxes.
     * @return {Array<CollisionBox>|string|boolean} An [tRexBox, obstacleBox]
     *    pair on a real crash, the string 'shielded' on a hit a shield
     *    would absorb, or false when there is no collision.
     */
    function checkForCollision(obstacle, tRex, opt_canvasCtx) {
        if (!obstacle || !tRex) {
            return false;
        }

        // Adjustments are made to the bounding box as there is a 1 pixel white
        // border around the t-rex and obstacles.
        var tRexBox = new CollisionBox(
            tRex.xPos + 1,
            tRex.yPos + 1,
            tRex.config.WIDTH - 2,
            tRex.config.HEIGHT - 2);

        var obstacleBox = new CollisionBox(
            obstacle.xPos + 1,
            obstacle.yPos + 1,
            obstacle.typeConfig.width * obstacle.size - 2,
            obstacle.typeConfig.height - 2);

        // Debug outer box
        if (opt_canvasCtx) {
            drawCollisionBoxes(opt_canvasCtx, tRexBox, obstacleBox);
        }

        // Invincibility check
        if (Runner.instance_ && Runner.instance_.invincibleTimer > 0) {
            return false;
        }

        // Ignore collision checks for non-lethal terrain gaps, platforms, or ice
        if (obstacle.typeConfig.type === 'GAP' || obstacle.typeConfig.type === 'PLATFORM_GAP' || obstacle.typeConfig.type === 'ICE') {
            return false;
        }

        // Simple outer bounds check.
        if (boxCompare(tRexBox, obstacleBox)) {
            var collisionBoxes = obstacle.collisionBoxes;
            if (!collisionBoxes || collisionBoxes.length === 0) {
                return false;
            }

            // A shield, or its post-hit grace period, would absorb this hit.
            if (tRex.hasShield) {
                return 'shielded';
            }
            if (Runner.instance_ && Runner.instance_.shieldInvulnerableTimer > 0) {
                return false;
            }
            var tRexCollisionBoxes = tRex.ducking ?
                Trex.collisionBoxes.DUCKING : Trex.collisionBoxes.RUNNING;

            // Detailed axis aligned box check.
            for (var t = 0; t < tRexCollisionBoxes.length; t++) {
                for (var i = 0; i < collisionBoxes.length; i++) {
                    // Adjust the box to actual positions.
                    var adjTrexBox =
                        createAdjustedCollisionBox(tRexCollisionBoxes[t], tRexBox);
                    var adjObstacleBox =
                        createAdjustedCollisionBox(collisionBoxes[i], obstacleBox);
                    var crashed = boxCompare(adjTrexBox, adjObstacleBox);

                    // Draw boxes for debug.
                    if (opt_canvasCtx) {
                        drawCollisionBoxes(opt_canvasCtx, adjTrexBox, adjObstacleBox);
                    }

                    if (crashed) {
                        return [adjTrexBox, adjObstacleBox];
                    }
                }
            }
        }
        return false;
    };


    /**
     * Adjust the collision box.
     * @param {!CollisionBox} box The original box.
     * @param {!CollisionBox} adjustment Adjustment box.
     * @return {CollisionBox} The adjusted collision box object.
     */
    function createAdjustedCollisionBox(box, adjustment) {
        return new CollisionBox(
            box.x + adjustment.x,
            box.y + adjustment.y,
            box.width,
            box.height);
    };


    /**
     * Draw the collision boxes for debug.
     */
    function drawCollisionBoxes(canvasCtx, tRexBox, obstacleBox) {
        canvasCtx.save();
        canvasCtx.strokeStyle = '#f00';
        canvasCtx.strokeRect(tRexBox.x, tRexBox.y, tRexBox.width, tRexBox.height);

        canvasCtx.strokeStyle = '#0f0';
        canvasCtx.strokeRect(obstacleBox.x, obstacleBox.y,
            obstacleBox.width, obstacleBox.height);
        canvasCtx.restore();
    };


    /**
     * Compare two collision boxes for a collision.
     * @param {CollisionBox} tRexBox
     * @param {CollisionBox} obstacleBox
     * @return {boolean} Whether the boxes intersected.
     */
    function boxCompare(tRexBox, obstacleBox) {
        var crashed = false;
        var tRexBoxX = tRexBox.x;
        var tRexBoxY = tRexBox.y;

        var obstacleBoxX = obstacleBox.x;
        var obstacleBoxY = obstacleBox.y;

        // Axis-Aligned Bounding Box method.
        if (tRexBox.x < obstacleBoxX + obstacleBox.width &&
            tRexBox.x + tRexBox.width > obstacleBoxX &&
            tRexBox.y < obstacleBox.y + obstacleBox.height &&
            tRexBox.height + tRexBox.y > obstacleBox.y) {
            crashed = true;
        }

        return crashed;
    };


    //******************************************************************************

    /**
     * Collision box object.
     * @param {number} x X position.
     * @param {number} y Y Position.
     * @param {number} w Width.
     * @param {number} h Height.
     */
    function CollisionBox(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    };

    //******************************************************************************

    /**
     * Collectible Bonus Item.
     * @param {HTMLCanvasElement} canvas
     * @param {HTMLImageElement} image
     * @param {number} canvasWidth
     * @constructor
     */
    function BonusItem(canvas, image, canvasWidth) {
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.image = image;
        this.width = 32;
        this.height = 32;
        this.xPos = canvasWidth + 50;
        // Placed between 25px and 45px: unreachable on foot, requires jumping
        this.yPos = getRandomNum(115, 155);
        this.remove = false;
    }

    BonusItem.prototype = {
        draw: function () {
            if (this.image.complete && this.image.naturalWidth > 0) {
                this.canvasCtx.drawImage(
                    this.image,
                    0, 0, this.image.naturalWidth, this.image.naturalHeight,
                    this.xPos, this.yPos,
                    this.width, this.height
                );
            }
        },

        update: function (deltaTime, speed) {
            if (!this.remove) {
                this.xPos -= Math.floor((speed * FPS / 1000) * deltaTime);
                this.draw();
                if (!this.isVisible()) {
                    this.remove = true;
                }
            }
        },

        isVisible: function () {
            return this.xPos + this.width > 0;
        }
    };


    //******************************************************************************

    /**
     * Obstacle.
     * @param {HTMLCanvasCtx} canvasCtx
     * @param {Obstacle.type} type
     * @param {Object} spritePos Obstacle position in sprite.
     * @param {Object} dimensions
     * @param {number} gapCoefficient Mutipler in determining the gap.
     * @param {number} speed
     * @param {number} opt_xOffset
     */
    function Obstacle(canvasCtx, type, spriteImgPos, dimensions,
        gapCoefficient, speed, opt_xOffset) {

        this.canvasCtx = canvasCtx;
        this.spritePos = spriteImgPos;
        this.typeConfig = type;
        this.gapCoefficient = gapCoefficient;
        this.size = getRandomNum(1, Obstacle.MAX_OBSTACLE_LENGTH);
        this.dimensions = dimensions;
        this.remove = false;
        this.xPos = dimensions.WIDTH + (opt_xOffset || 0);
        this.yPos = 0;
        this.width = 0;
        this.collisionBoxes = [];
        this.gap = 0;
        this.speedOffset = 0;

        // For animated obstacles.
        this.currentFrame = 0;
        this.timer = 0;

        this.init(speed);
    };

    /**
     * Coefficient for calculating the maximum gap.
     * @const
     */
    Obstacle.MAX_GAP_COEFFICIENT = 1.5;

    /**
     * Maximum obstacle grouping count.
     * @const
     */
    Obstacle.MAX_OBSTACLE_LENGTH = 3,


        Obstacle.prototype = {
            /**
             * Initialise the DOM for the obstacle.
             * @param {number} speed
             */
            init: function (speed) {
                this.cloneCollisionBoxes();

                // Only allow sizing if we're at the right speed.
                if (this.size > 1 && this.typeConfig.multipleSpeed > speed) {
                    this.size = 1;
                }

                this.width = this.typeConfig.width * this.size;

                // Check if obstacle can be positioned at various heights.
                if (Array.isArray(this.typeConfig.yPos)) {
                    var yPosConfig = IS_MOBILE ? this.typeConfig.yPosMobile :
                        this.typeConfig.yPos;
                    this.yPos = yPosConfig[getRandomNum(0, yPosConfig.length - 1)];
                } else {
                    this.yPos = this.typeConfig.yPos;
                }
                
                this.baseYPos = this.yPos; // Store the initial spawn height
				this.hoverTimer = getRandomNum(0, 1000);

                this.draw();

                // Make collision box adjustments,
                // Central box is adjusted to the size as one box.
                //      ____        ______        ________
                //    _|   |-|    _|     |-|    _|       |-|
                //   | |<->| |   | |<--->| |   | |<----->| |
                //   | | 1 | |   | |  2  | |   | |   3   | |
                //   |_|___|_|   |_|_____|_|   |_|_______|_|
                //
                if (this.size > 1) {
                    this.collisionBoxes[1].width = this.width - this.collisionBoxes[0].width -
                        this.collisionBoxes[2].width;
                    this.collisionBoxes[2].x = this.width - this.collisionBoxes[2].width;
                }

                // For obstacles that go at a different speed from the horizon.
                if (this.typeConfig.speedOffset) {
                    this.speedOffset = Math.random() > 0.5 ? this.typeConfig.speedOffset :
                        -this.typeConfig.speedOffset;
                }

                this.gap = this.getGap(this.gapCoefficient, speed);
            },

            /**
             * Draw and crop based on size.
             */
            draw: function () {
                // Render UFO if this obstacle is the easter egg
                if (this.isUfo && Runner.ufoImage && Runner.ufoImage.complete) {
                    this.canvasCtx.drawImage(
                        Runner.ufoImage,
                        0, 0, Runner.ufoImage.naturalWidth, Runner.ufoImage.naturalHeight,
                        this.xPos, this.yPos,
                        this.typeConfig.width, this.typeConfig.height
                    );
                    return;
                }
		    
                // Render Bigfoot if this obstacle is the easter egg
                if (this.isBigfoot && Runner.bigfootImage && Runner.bigfootImage.complete) {
                    this.canvasCtx.drawImage(
                        Runner.bigfootImage,
                        0, 0, Runner.bigfootImage.naturalWidth, Runner.bigfootImage.naturalHeight,
                        this.xPos, this.yPos,
                        this.typeConfig.width, this.typeConfig.height
                    );
                    return;
                }

                // Helper to render water across the pit width
                var drawWater = function (ctx, img, x, y, w, h) {
                    ctx.clearRect(x, 226, w, 24);
                    if (img && img.complete && img.naturalWidth > 0) {
                        ctx.save();
                        if (isMonochromeTheme()) {
                            ctx.filter = 'grayscale(100%)';
                        }
                        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, w, h);
                        ctx.restore();
                    } else {
                        // Fallback while loading
                        ctx.fillStyle = isMonochromeTheme() ? '#333333' : '#204060';
                        ctx.fillRect(x, y, w, h);
                    }
                    // Cliff banks / shorelines on the left and right edges
                    ctx.fillStyle = '#535353';
                    ctx.fillRect(x, 227, 2, 23);
                    ctx.fillRect(x + w - 2, 227, 2, 23);
                };

                // Render single water pit / gap
                if (this.typeConfig.type === 'GAP') {
                    drawWater(this.canvasCtx, Runner.waterImage, this.xPos, 227, this.width, 23);
                    return;
                }

                // Render large gap with elevated floating grass island
                if (this.typeConfig.type === 'PLATFORM_GAP') {
                    var pStart = this.xPos + this.typeConfig.platOffset;
                    var pWidth = this.typeConfig.platWidth;
                    var pEnd = pStart + pWidth;
                    var pHeight = this.typeConfig.platHeight;
                    var pY = 227 - pHeight;

                    // Draw the water body across the entire gap
                    drawWater(this.canvasCtx, Runner.waterImage, this.xPos, 227, this.width, 23);

                    // Floating island underbelly (dirt slab below grass)
                    this.canvasCtx.fillStyle = '#3a3a3a';
                    this.canvasCtx.fillRect(pStart + 1, pY + 10, pWidth - 2, 8);
                    this.canvasCtx.fillStyle = '#262626';
                    this.canvasCtx.fillRect(pStart + 4, pY + 18, pWidth - 8, 4);

                    // Island rock side trims
                    this.canvasCtx.fillStyle = '#535353';
                    this.canvasCtx.fillRect(pStart, pY + 4, 2, 12);
                    this.canvasCtx.fillRect(pEnd - 2, pY + 4, 2, 12);

                    // Sample and draw themed grass texture from sprite sheet
                    var spriteHorizon = Runner.spriteDefinition.HDPI.HORIZON;
                    var scale = 2;
                    var sourceX = spriteHorizon.x + (40 * scale);
                    var sourceY = spriteHorizon.y;
                    var sourceW = pWidth * scale;
                    var sourceH = 14 * scale;

                    this.canvasCtx.drawImage(
                        Runner.getSpriteImage('HORIZON'),
                        sourceX, sourceY,
                        sourceW, sourceH,
                        pStart, pY,
                        pWidth, 14
                    );
                    return;
                }

                // Render slippery ice obstacle
                if (this.typeConfig.type === 'ICE') {
                    var iceImg = Runner.iceImage;
                    if (iceImg && iceImg.complete && iceImg.naturalWidth > 0) {
                        this.canvasCtx.save();
                        if (isMonochromeTheme()) {
                            this.canvasCtx.filter = 'grayscale(100%)';
                        }
                        this.canvasCtx.drawImage(
                            iceImg,
                            0, 0, iceImg.naturalWidth, iceImg.naturalHeight,
                            this.xPos, this.yPos,
                            this.typeConfig.width, this.typeConfig.height
                        );
                        this.canvasCtx.restore();
                    } else {
                        // Fallback color while loading
                        this.canvasCtx.fillStyle = isMonochromeTheme() ? '#cccccc' : '#90e0ef';
                        this.canvasCtx.fillRect(this.xPos, this.yPos, this.width, this.typeConfig.height);
                    }
                    return;
                }
		    
                var sourceWidth = this.typeConfig.width;
                var sourceHeight = this.typeConfig.height;

                sourceWidth = sourceWidth * 2;
                sourceHeight = sourceHeight * 2;

                // X position in sprite.
                var sourceX = (sourceWidth * this.size) * (0.5 * (this.size - 1)) +
                    this.spritePos.x;

                // Animation frames.
                if (this.currentFrame > 0) {
                    sourceX += sourceWidth * this.currentFrame;
                }

                // Regular obstacle rendering (Cactus / Pterodactyl):
                var obstacleImg = Runner.getSpriteImage(this.typeConfig.type);
                
                this.canvasCtx.drawImage(obstacleImg,
                    sourceX, this.spritePos.y,
                    sourceWidth * this.size, sourceHeight,
                    this.xPos, this.yPos,
                    this.typeConfig.width * this.size, this.typeConfig.height);
            },

            /**
             * Obstacle frame update.
             * @param {number} deltaTime
             * @param {number} speed
             */
            update: function (deltaTime, speed) {
                if (!this.remove) {
                    if (this.typeConfig.speedOffset) {
                        speed += this.speedOffset;
                    }
                    this.xPos -= Math.floor((speed * FPS / 1000) * deltaTime);

                    // Slow vertical hovering oscillation or invisible avoidance
                    if (this.typeConfig.type === 'PTERODACTYL' || this.isUfo) {
                        if (window.Runner && Runner.instance_ && Runner.instance_.invisibleTimer > 0) {
                            this.yPos += (15 - this.yPos) * 0.1; // Fly up high to avoid player
                        } else {
                            this.hoverTimer += deltaTime;
                            this.yPos = this.baseYPos + Math.sin(this.hoverTimer * 0.002) * 16;
                        }
                    }

                    // Update frame
                    if (this.typeConfig.numFrames) {
                        this.timer += deltaTime;
                        if (this.timer >= this.typeConfig.frameRate) {
                            this.currentFrame =
                                this.currentFrame == this.typeConfig.numFrames - 1 ?
                                    0 : this.currentFrame + 1;
                            this.timer = 0;
                        }
                    }
                    this.draw();

                    if (!this.isVisible()) {
                        this.remove = true;
                    }
                }
            },

            /**
             * Calculate a random gap size.
             * - Minimum gap gets wider as speed increses
             * @param {number} gapCoefficient
             * @param {number} speed
             * @return {number} The gap size.
             */
            getGap: function (gapCoefficient, speed) {
                var minGap = Math.round(this.width * speed +
                    this.typeConfig.minGap * gapCoefficient);
                var maxGap = Math.round(minGap * Obstacle.MAX_GAP_COEFFICIENT);
                return getRandomNum(minGap, maxGap);
            },

            /**
             * Check if obstacle is visible.
             * @return {boolean} Whether the obstacle is in the game area.
             */
            isVisible: function () {
                return this.xPos + this.width > 0;
            },

            /**
             * Make a copy of the collision boxes, since these will change based on
             * obstacle type and size.
             */
            cloneCollisionBoxes: function () {
                var collisionBoxes = this.typeConfig.collisionBoxes;

                for (var i = collisionBoxes.length - 1; i >= 0; i--) {
                    this.collisionBoxes[i] = new CollisionBox(collisionBoxes[i].x,
                        collisionBoxes[i].y, collisionBoxes[i].width,
                        collisionBoxes[i].height);
                }
            }
        };


    /**
     * Obstacle definitions.
     * minGap: minimum pixel space betweeen obstacles.
     * multipleSpeed: Speed at which multiples are allowed.
     * speedOffset: speed faster / slower than the horizon.
     * minSpeed: Minimum speed which the obstacle can make an appearance.
     */
    Obstacle.types = [
        {
            type: 'CACTUS_SMALL',
            width: 17,
            height: 35,
            yPos: 205,
            multipleSpeed: 4,
            minGap: 120,
            minSpeed: 0,
            collisionBoxes: [
                new CollisionBox(0, 7, 5, 27),
                new CollisionBox(4, 0, 6, 34),
                new CollisionBox(10, 4, 7, 14)
            ]
        },
        {
            type: 'CACTUS_LARGE',
            width: 25,
            height: 50,
            yPos: 190,
            multipleSpeed: 7,
            minGap: 120,
            minSpeed: 0,
            collisionBoxes: [
                new CollisionBox(0, 12, 7, 38),
                new CollisionBox(8, 0, 7, 49),
                new CollisionBox(13, 10, 10, 38)
            ]
        },
        {
            type: 'PTERODACTYL',
            width: 46,
            height: 40,
            yPos: [200, 175, 150], // Variable height.
            yPosMobile: [200, 150], // Variable height mobile.
            multipleSpeed: 999,
            minSpeed: 8.5,
            minGap: 150,
            collisionBoxes: [
                new CollisionBox(15, 15, 16, 5),
                new CollisionBox(18, 21, 24, 6),
                new CollisionBox(2, 14, 4, 3),
                new CollisionBox(6, 10, 4, 7),
                new CollisionBox(10, 8, 6, 9)
            ],
            numFrames: 2,
            frameRate: 1000 / 6,
            speedOffset: .8
        },
{
            type: 'GAP',
            width: 75,
            height: 30,
            yPos: 225,
            multipleSpeed: 999,
            minGap: 130,
            minSpeed: 0,
            collisionBoxes: []
        },
        {
            type: 'PLATFORM_GAP',
            width: 320,          // Total pit width across both gaps + platform
            height: 50,
            yPos: 195,
            multipleSpeed: 999,
            minGap: 220,         // Runway after completing the jump-off
            minSpeed: 4,
            platOffset: 95,      // First gap: ~95px wide (requires a dedicated jump)
            platWidth: 130,      // Wide enough to land, react, and time the next leap
            platHeight: 28,      // Elevation above ground
            collisionBoxes: []
        },
        {
            type: 'ICE',
            width: 270,
            height: 45,
            yPos: 215,           // Sits on the track surface
            multipleSpeed: 999,
            minGap: 200,
            minSpeed: 3,
            collisionBoxes: []   // Empty to prevent default crash logic
        },
    ];


    //******************************************************************************
    /**
     * T-rex game character.
     * @param {HTMLCanvas} canvas
     * @param {Object} spritePos Positioning within image sprite.
     * @constructor
     */
    function Trex(canvas, spritePos) {
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.spritePos = spritePos;
        this.xPos = 0;
        this.yPos = 0;
        // Position when on the ground.
        this.groundYPos = 0;
        this.currentFrame = 0;
        this.currentAnimFrames = [];
        this.blinkDelay = 0;
        this.blinkCount = 0;
        this.animStartTime = 0;
        this.timer = 0;
        this.msPerFrame = 1000 / FPS;
        this.config = Trex.config;
        // Current status.
        this.status = Trex.status.WAITING;

        this.jumping = false;
        this.ducking = false;
        this.jumpVelocity = 0;
        this.reachedMinHeight = false;
        this.speedDrop = false;
        this.jumpCount = 0;
        this.jumpspotX = 0;
		
		this.isSlipping = false;
        this.jumpPending = false;
        this.jumpDelayTimer = 0;

        this.init();
    };


    /**
     * T-rex player config.
     * @enum {number}
     */
    Trex.config = {
        DROP_VELOCITY: -5,
        GRAVITY: 0.6,
        HEIGHT: 47,
        HEIGHT_DUCK: 25,
        INIITAL_JUMP_VELOCITY: -10,
        INTRO_DURATION: 1500,
        MAX_JUMP_HEIGHT: 30,
        MIN_JUMP_HEIGHT: 30,
        SPEED_DROP_COEFFICIENT: 3,
        SPRITE_WIDTH: 262,
        START_X_POS: 50,
        WIDTH: 44,
        WIDTH_DUCK: 59
    };


    /**
     * Used in collision detection.
     * @type {Array<CollisionBox>}
     */
    Trex.collisionBoxes = {
        DUCKING: [
            new CollisionBox(1, 18, 55, 25)
        ],
        RUNNING: [
            new CollisionBox(22, 0, 17, 16),
            new CollisionBox(1, 18, 30, 9),
            new CollisionBox(10, 35, 14, 8),
            new CollisionBox(1, 24, 29, 5),
            new CollisionBox(5, 30, 21, 4),
            new CollisionBox(9, 34, 15, 4)
        ]
    };


    /**
     * Animation states.
     * @enum {string}
     */
    Trex.status = {
        CRASHED: 'CRASHED',
        DUCKING: 'DUCKING',
        JUMPING: 'JUMPING',
        RUNNING: 'RUNNING',
        WAITING: 'WAITING'
    };

    /**
     * Blinking coefficient.
     * @const
     */
    Trex.BLINK_TIMING = 7000;


    /**
     * Animation config for different states.
     * @enum {Object}
     */
    Trex.animFrames = {
        WAITING: {
            frames: [44, 0],
            msPerFrame: 1000 / 3
        },
        RUNNING: {
            frames: [88, 132],
            msPerFrame: 1000 / 12
        },
        CRASHED: {
            frames: [176, 220],
            msPerFrame: 1000 / 2
        },
        JUMPING: {
            frames: [0],
            msPerFrame: 1000 / 60
        },
        DUCKING: {
            frames: [264, 323],
            msPerFrame: 1000 / 8
        }
    };


    Trex.prototype = {
        /**
         * T-rex player initaliser.
         * Sets the t-rex to blink at random intervals.
         */
        init: function () {
            this.defaultGroundY = Runner.defaultDimensions.HEIGHT - this.config.HEIGHT -
                Runner.config.BOTTOM_PAD;
            this.groundYPos = this.defaultGroundY;
            this.yPos = this.groundYPos;
            this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;

            this.draw(0, 0);
            this.update(0, Trex.status.WAITING);
        },

        startFall: function () {
            if (!this.jumping) {
                this.jumping = true;
                this.jumpVelocity = 2; // Initial downward gravity pull
                this.update(0, Trex.status.JUMPING);
            }
        },

        /**
         * Setter for the jump velocity.
         * The approriate drop velocity is also set.
         */
        setJumpVelocity: function (setting) {
            this.config.INIITAL_JUMP_VELOCITY = -setting;
            this.config.DROP_VELOCITY = -setting / 2;
        },

        /**
         * Set the animation status.
         * @param {!number} deltaTime
         * @param {Trex.status} status Optional status to switch to.
         */
        update: function (deltaTime, opt_status) {
            this.timer += deltaTime;

            // Update the status.
            if (opt_status) {
                this.status = opt_status;
                this.currentFrame = 0;
                this.msPerFrame = Trex.animFrames[opt_status].msPerFrame;
                this.currentAnimFrames = Trex.animFrames[opt_status].frames;

                if (opt_status == Trex.status.WAITING) {
                    this.animStartTime = getTimeStamp();
                    this.setBlinkDelay();
                }
            }

            // Game intro animation, T-rex moves in from the left.
            if (this.playingIntro && this.xPos < this.config.START_X_POS) {
                this.xPos += Math.round((this.config.START_X_POS /
                    this.config.INTRO_DURATION) * deltaTime);
            }

            if (this.status == Trex.status.WAITING) {
                this.blink(getTimeStamp());
            } else {
                this.draw(this.currentAnimFrames[this.currentFrame], 0);
            }

            // Update the frame position.
            if (this.timer >= this.msPerFrame) {
                this.currentFrame = this.currentFrame ==
                    this.currentAnimFrames.length - 1 ? 0 : this.currentFrame + 1;
                this.timer = 0;
            }

            // Speed drop becomes duck if the down key is still being pressed.
            if (this.speedDrop && this.yPos == this.groundYPos) {
                this.speedDrop = false;
                this.setDuck(true);
            }
        },

        /**
         * Draw the t-rex to a particular position.
         * @param {number} x
         * @param {number} y
         */
        draw: function (x, y) {
            var sourceX = x;
            var sourceY = y;
            var sourceWidth = this.ducking && this.status != Trex.status.CRASHED ?
                this.config.WIDTH_DUCK : this.config.WIDTH;
            var sourceHeight = this.config.HEIGHT;

            sourceX *= 2;
            sourceY *= 2;
            sourceWidth *= 2;
            sourceHeight *= 2;

            sourceX += this.spritePos.x;
            sourceY += this.spritePos.y;

            this.canvasCtx.save();
            if (window.Runner && Runner.instance_ && Runner.instance_.invisibleTimer > 0) {
                this.canvasCtx.globalAlpha = 0.4;
            }

            var trexImg = Runner.getSpriteImage('TREX');
            if (this.ducking && this.status != Trex.status.CRASHED) {
                this.canvasCtx.drawImage(trexImg, sourceX, sourceY,
                    sourceWidth, sourceHeight,
                    this.xPos, this.yPos,
                    this.config.WIDTH_DUCK, this.config.HEIGHT);
            } else {
                this.canvasCtx.drawImage(trexImg, sourceX, sourceY,
                    sourceWidth, sourceHeight,
                    this.xPos, this.yPos,
                    this.config.WIDTH, this.config.HEIGHT);
            }
            this.canvasCtx.restore();

            // Draw shield bubble if active
            if (this.hasShield) {
                this.canvasCtx.save();
                this.canvasCtx.strokeStyle = '#00ffff';
                this.canvasCtx.lineWidth = 2;
                this.canvasCtx.beginPath();
                this.canvasCtx.arc(
                    this.xPos + (this.config.WIDTH / 2),
                    this.yPos + (this.config.HEIGHT / 2),
                    Math.max(this.config.WIDTH, this.config.HEIGHT) * 0.7,
                    0, Math.PI * 2
                );
                this.canvasCtx.stroke();
                this.canvasCtx.restore();
            }
        },

        /**
         * Sets a random time for the blink to happen.
         */
        setBlinkDelay: function () {
            this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
        },

        /**
         * Make t-rex blink at random intervals.
         * @param {number} time Current time in milliseconds.
         */
        blink: function (time) {
            var deltaTime = time - this.animStartTime;

            if (deltaTime >= this.blinkDelay) {
                this.draw(this.currentAnimFrames[this.currentFrame], 0);

                if (this.currentFrame == 1) {
                    // Set new random delay to blink.
                    this.setBlinkDelay();
                    this.animStartTime = time;
                    this.blinkCount++;
                }
            }
        },

        /**
         * Initialise a jump.
         * @param {number} speed
         */
        startJump: function (speed) {
            if (!this.jumping) {
                this.update(0, Trex.status.JUMPING);
                this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY - (speed / 10);
                this.jumping = true;
                this.reachedMinHeight = false;
                this.speedDrop = false;
                this.holdingJump = true;
                this.canFlutter = true;
                this.fluttering = false;
                this.flutterTime = 0;
                this.hasDoubleJumped = false;
            } else if (window.Runner && Runner.instance_ && Runner.instance_.doubleJumpTimer > 0 && !this.hasDoubleJumped) {
                this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY * 0.8;
                this.hasDoubleJumped = true;
                this.fluttering = false;
            }
        },

        endJump: function () {
            this.holdingJump = false;
            this.fluttering = false;
            if (this.jumpVelocity < 0) {
                this.jumpVelocity = Math.max(this.jumpVelocity, -3.5);
            }
        },

        /**
         * Update frame for a jump.
         * @param {number} deltaTime
         * @param {number} speed
         */
        updateJump: function (deltaTime, speed) {
            var msPerFrame = Trex.animFrames[this.status].msPerFrame;
            var framesElapsed = deltaTime / msPerFrame;

            // Land on ground or platform surface when falling downwards
            if (this.jumpVelocity >= 0 && this.yPos >= this.groundYPos) {
                this.yPos = this.groundYPos;
                this.reset(this.groundYPos);
                this.jumpCount++;
            }

            // Yoshi-Flutter mechanic: requires FLUTTER power-up active
            if (window.Runner && Runner.instance_ && Runner.instance_.flutterTimer > 0 && this.holdingJump && this.canFlutter && this.jumpVelocity >= -3 && this.jumpVelocity < 5 && this.yPos < this.groundYPos - 25) {
                this.fluttering = true;
                this.flutterTime += deltaTime;
                this.jumpVelocity = -0.8; // Buoyancy lift
                if (this.flutterTime > 400) {
                    this.fluttering = false;
                    this.canFlutter = false;
                }
            } else {
                this.fluttering = false;
            }

            // Speed drop / Fast-Fall Stomp
            if (this.speedDrop) {
                this.yPos += Math.round(this.jumpVelocity *
                    this.config.SPEED_DROP_COEFFICIENT * framesElapsed);
            } else {
                this.yPos += Math.round(this.jumpVelocity * framesElapsed);
            }

            if (!this.fluttering) {
                this.jumpVelocity += this.config.GRAVITY * framesElapsed;
            }

            // Minimum height has been reached.
            if (this.yPos < this.minJumpHeight || this.speedDrop) {
                this.reachedMinHeight = true;
            }

            // Reached max height via speed drop only
            if (this.speedDrop) {
                this.endJump();
            }

            // Back down at ground level. Jump completed.
            if (this.yPos > this.groundYPos) {
                this.reset(this.groundYPos);
                this.jumpCount++;
            }

            this.update(deltaTime);
        },

        setSpeedDrop: function () {
            this.speedDrop = true;
            this.jumpVelocity = 14; // Snappy downward slam velocity
            this.fluttering = false;
            this.canFlutter = false;
        },

        /**
         * @param {boolean} isDucking.
         */
        setDuck: function (isDucking) {
            if (isDucking && this.status != Trex.status.DUCKING) {
                this.update(0, Trex.status.DUCKING);
                this.ducking = true;
            } else if (this.status == Trex.status.DUCKING) {
                this.update(0, Trex.status.RUNNING);
                this.ducking = false;
            }
        },

        /**
         * Reset the t-rex to running at start of game or landing.
         * @param {number} opt_groundY Optional ground Y position.
         */
        reset: function (opt_groundY) {
            this.groundYPos = opt_groundY !== undefined ? opt_groundY : this.defaultGroundY;
            this.yPos = this.groundYPos;
            this.xPos = Trex.config.START_X_POS;
            this.jumpVelocity = 0;
            this.jumping = false;
            this.ducking = false;
            this.update(0, Trex.status.RUNNING);
            this.midair = false;
            this.speedDrop = false;
            this.jumpCount = 0;
            this.holdingJump = false;
            this.canFlutter = true;
            this.fluttering = false;
            this.flutterTime = 0;
            this.isSlipping = false;
            this.jumpPending = false;
            this.jumpDelayTimer = 0;
        }
    };


    //******************************************************************************

    /**
     * Handles displaying the distance meter.
     * @param {!HTMLCanvasElement} canvas
     * @param {Object} spritePos Image position in sprite.
     * @param {number} canvasWidth
     * @constructor
     */
    function DistanceMeter(canvas, spritePos, canvasWidth) {
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.image = Runner.imageSprite;
        this.spritePos = spritePos;
        this.x = 0;
        this.y = 5;

        this.currentDistance = 0;
        this.maxScore = 0;
        this.highScore = 0;
        this.container = null;

        this.digits = [];
        this.acheivement = false;
        this.defaultString = '';
        this.flashTimer = 0;
        this.flashIterations = 0;
        this.invertTrigger = false;

        this.config = DistanceMeter.config;
        this.maxScoreUnits = this.config.MAX_DISTANCE_UNITS;
        this.init(canvasWidth);
    };


    /**
     * @enum {number}
     */
    DistanceMeter.dimensions = {
        WIDTH: 10,
        HEIGHT: 13,
        DEST_WIDTH: 11
    };


    /**
     * Y positioning of the digits in the sprite sheet.
     * X position is always 0.
     * @type {Array<number>}
     */
    DistanceMeter.yPos = [0, 13, 27, 40, 53, 67, 80, 93, 107, 120];


    /**
     * Distance meter config.
     * @enum {number}
     */
    DistanceMeter.config = {
        // Number of digits.
        MAX_DISTANCE_UNITS: 5,

        // Distance that causes achievement animation.
        ACHIEVEMENT_DISTANCE: 100,

        // Used for conversion from pixel distance to a scaled unit.
        COEFFICIENT: 0.025,

        // Flash duration in milliseconds.
        FLASH_DURATION: 1000 / 4,

        // Flash iterations for achievement animation.
        FLASH_ITERATIONS: 3
    };


    DistanceMeter.prototype = {
        /**
         * Initialise the distance meter to '00000'.
         * @param {number} width Canvas width in px.
         */
        init: function (width) {
            var maxDistanceStr = '';

            this.calcXPos(width);
            this.maxScore = this.maxScoreUnits;
            for (var i = 0; i < this.maxScoreUnits; i++) {
                this.draw(i, 0);
                this.defaultString += '0';
                maxDistanceStr += '9';
            }

            this.maxScore = parseInt(maxDistanceStr);
        },

        /**
         * Calculate the xPos in the canvas.
         * @param {number} canvasWidth
         */
        calcXPos: function (canvasWidth) {
            this.x = canvasWidth - (DistanceMeter.dimensions.DEST_WIDTH *
                (this.maxScoreUnits + 1));
        },

        /**
         * Draw a digit to canvas.
         * @param {number} digitPos Position of the digit.
         * @param {number} value Digit value 0-9.
         * @param {boolean} opt_highScore Whether drawing the high score.
         */
        draw: function (digitPos, value, opt_highScore) {
            var sourceWidth = DistanceMeter.dimensions.WIDTH;
            var sourceHeight = DistanceMeter.dimensions.HEIGHT;
            var sourceX = DistanceMeter.dimensions.WIDTH * value;
            var sourceY = 0;

            var targetX = digitPos * DistanceMeter.dimensions.DEST_WIDTH;
            var targetY = this.y;
            var targetWidth = DistanceMeter.dimensions.WIDTH;
            var targetHeight = DistanceMeter.dimensions.HEIGHT;

            sourceWidth *= 2;
            sourceHeight *= 2;
            sourceX *= 2;

            sourceX += this.spritePos.x;
            sourceY += this.spritePos.y;

            this.canvasCtx.save();

            if (opt_highScore) {
                // Left of the current score.
                var highScoreX = this.x - (this.maxScoreUnits * 2) *
                    DistanceMeter.dimensions.WIDTH;
                this.canvasCtx.translate(highScoreX, this.y);
            } else {
                this.canvasCtx.translate(this.x, this.y);
            }

            this.canvasCtx.drawImage(Runner.getSpriteImage('TEXT_SPRITE'), sourceX, sourceY,
                sourceWidth, sourceHeight,
                targetX, targetY,
                targetWidth, targetHeight
            );

            this.canvasCtx.restore();
        },

        /**
         * Covert pixel distance to a 'real' distance.
         * @param {number} distance Pixel distance ran.
         * @return {number} The 'real' distance ran.
         */
        getActualDistance: function (distance) {
            return distance ? Math.round(distance * this.config.COEFFICIENT) : 0;
        },

        /**
         * Update the distance meter.
         * @param {number} distance
         * @param {number} deltaTime
         * @return {boolean} Whether the acheivement sound fx should be played.
         */
        update: function (deltaTime, distance) {
            var paint = true;
            var playSound = false;

            if (!this.acheivement) {
                distance = this.getActualDistance(distance);
                // Score has gone beyond the initial digit count.
                if (distance > this.maxScore && this.maxScoreUnits ==
                    this.config.MAX_DISTANCE_UNITS) {
                    this.maxScoreUnits++;
                    this.maxScore = parseInt(this.maxScore + '9');
                } else {
                    this.distance = 0;
                }

                if (distance > 0) {
                    // Acheivement unlocked
                    if (distance % this.config.ACHIEVEMENT_DISTANCE == 0) {
                        // Flash score and play sound.
                        this.acheivement = true;
                        this.flashTimer = 0;
                        playSound = true;
                    }

                    // Create a string representation of the distance with leading 0.
                    var distanceStr = (this.defaultString +
                        distance).substr(-this.maxScoreUnits);
                    this.digits = distanceStr.split('');
                } else {
                    this.digits = this.defaultString.split('');
                }
            } else {
                // Control flashing of the score on reaching acheivement.
                if (this.flashIterations <= this.config.FLASH_ITERATIONS) {
                    this.flashTimer += deltaTime;

                    if (this.flashTimer < this.config.FLASH_DURATION) {
                        paint = false;
                    } else if (this.flashTimer >
                        this.config.FLASH_DURATION * 2) {
                        this.flashTimer = 0;
                        this.flashIterations++;
                    }
                } else {
                    this.acheivement = false;
                    this.flashIterations = 0;
                    this.flashTimer = 0;
                }
            }

            // Draw the digits if not flashing.
            if (paint) {
                for (var i = this.digits.length - 1; i >= 0; i--) {
                    this.draw(i, parseInt(this.digits[i]));
                }
            }

            this.drawHighScore();
            return playSound;
        },

        /**
         * Draw the high score.
         */
        drawHighScore: function () {
            this.canvasCtx.save();
            this.canvasCtx.globalAlpha = .8;
            for (var i = this.highScore.length - 1; i >= 0; i--) {
                this.draw(i, parseInt(this.highScore[i], 10), true);
            }
            this.canvasCtx.restore();
        },

        /**
         * Set the highscore as a array string.
         * Position of char in the sprite: H - 10, I - 11.
         * @param {number} distance Distance ran in pixels.
         */
        setHighScore: function (distance) {
            distance = this.getActualDistance(distance);
            var highScoreStr = (this.defaultString +
                distance).substr(-this.maxScoreUnits);

            this.highScore = ['10', '11', ''].concat(highScoreStr.split(''));
        },

        /**
         * Reset the distance meter back to '00000'.
         * @param {number=} opt_highScoreDistance Pixel distance of the
         *     current high score. When given (and non-zero), the high
         *     score digits are (re)applied via setHighScore so the HUD
         *     reflects it immediately after a restart, rather than
         *     relying solely on whatever setHighScore call, if any,
         *     happened to run during the previous game's gameOver().
         */
        reset: function (opt_highScoreDistance) {
            this.update(0);
            this.acheivement = false;
            if (opt_highScoreDistance) {
                this.setHighScore(opt_highScoreDistance);
            }
        }
    };


    //******************************************************************************

    /**
     * Cloud background item.
     * Similar to an obstacle object but without collision boxes.
     * @param {HTMLCanvasElement} canvas Canvas element.
     * @param {Object} spritePos Position of image in sprite.
     * @param {number} containerWidth
     */
    function Cloud(canvas, spritePos, containerWidth) {
        this.canvas = canvas;
        this.canvasCtx = this.canvas.getContext('2d');
        this.spritePos = spritePos;
        this.containerWidth = containerWidth;
        this.xPos = containerWidth;
        this.yPos = 0;
        this.remove = false;
        this.cloudGap = getRandomNum(Cloud.config.MIN_CLOUD_GAP,
            Cloud.config.MAX_CLOUD_GAP);

        this.init();
    };


    /**
     * Cloud object config.
     * @enum {number}
     */
    Cloud.config = {
        HEIGHT: 14,
        MAX_CLOUD_GAP: 400,
        MAX_SKY_LEVEL: 30,
        MIN_CLOUD_GAP: 100,
        MIN_SKY_LEVEL: 71,
        WIDTH: 46
    };


    Cloud.prototype = {
        /**
         * Initialise the cloud. Sets the Cloud height.
         */
        init: function () {
            this.yPos = getRandomNum(Cloud.config.MAX_SKY_LEVEL,
                Cloud.config.MIN_SKY_LEVEL);
            this.draw();
        },

        /**
         * Draw the cloud.
         */
        draw: function () {
            this.canvasCtx.save();
            var sourceWidth = Cloud.config.WIDTH;
            var sourceHeight = Cloud.config.HEIGHT;

            sourceWidth = sourceWidth * 2;
            sourceHeight = sourceHeight * 2;

            this.canvasCtx.drawImage(Runner.getSpriteImage('CLOUD'), this.spritePos.x,
                this.spritePos.y,
                sourceWidth, sourceHeight,
                this.xPos, this.yPos,
                Cloud.config.WIDTH, Cloud.config.HEIGHT);

            this.canvasCtx.restore();
        },

        /**
         * Update the cloud position.
         * @param {number} speed
         */
        update: function (speed) {
            if (!this.remove) {
                this.xPos -= Math.ceil(speed);
                this.draw();

                // Mark as removeable if no longer in the canvas.
                if (!this.isVisible()) {
                    this.remove = true;
                }
            }
        },

        /**
         * Check if the cloud is visible on the stage.
         * @return {boolean}
         */
        isVisible: function () {
            return this.xPos + Cloud.config.WIDTH > 0;
        }
    };


    //******************************************************************************

    /**
     * Nightmode shows a moon and stars on the horizon.
     */
    function NightMode(canvas, spritePos, containerWidth) {
        this.spritePos = spritePos;
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.xPos = containerWidth - 50;
        this.yPos = 30;
        this.currentPhase = 0;
        this.opacity = 0;
        this.containerWidth = containerWidth;
        this.stars = [];
        this.drawStars = false;
        this.placeStars();

        // Ensure canvas container stays on top of the night overlay
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.style.zIndex = '2';
        }

        // Night shade overlay to darken the theme background without touching sprites
        this.overlay = document.getElementById('night-overlay');
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'night-overlay';
            this.overlay.style.position = 'fixed';
            this.overlay.style.top = '0';
            this.overlay.style.left = '0';
            this.overlay.style.width = '100vw';
            this.overlay.style.height = '100vh';
            this.overlay.style.backgroundColor = '#000000';
            this.overlay.style.pointerEvents = 'none';
            this.overlay.style.zIndex = '1';
            this.overlay.style.opacity = '0';
            this.overlay.style.willChange = 'opacity';
            document.body.appendChild(this.overlay);
        }
    };

    /**
     * @enum {number}
     */
    NightMode.config = {
        FADE_SPEED: 0.035,
        HEIGHT: 40,
        MOON_SPEED: 0.25,
        NUM_STARS: 2,
        STAR_SIZE: 9,
        STAR_SPEED: 0.3,
        STAR_MAX_Y: 70,
        WIDTH: 20,
        MAX_DARKNESS: 0.7  // Maximum darkness overlay (0.0 = day, 0.7 = night)
    };

    NightMode.phases = [140, 120, 100, 60, 40, 20, 0];

    NightMode.prototype = {
        /**
         * Update moving moon, changing phases.
         * @param {boolean} activated Whether night mode is activated.
         * @param {number} delta
         */
        update: function (activated, delta) {
            // Moon phase.
            if (activated && this.opacity == 0) {
                this.currentPhase++;

                if (this.currentPhase >= NightMode.phases.length) {
                    this.currentPhase = 0;
                }
            }

            // Fade in / out.
            if (activated && (this.opacity < 1 || this.opacity == 0)) {
                this.opacity += NightMode.config.FADE_SPEED;
            } else if (this.opacity > 0) {
                this.opacity -= NightMode.config.FADE_SPEED;
            }

            // Clamp opacity between 0 and 1
            this.opacity = Math.max(0, Math.min(1, this.opacity));

            // Sync background darkness with moon/stars opacity
            if (this.overlay) {
                this.overlay.style.opacity = (this.opacity * NightMode.config.MAX_DARKNESS).toFixed(3);
            }

            // Set moon positioning.
            if (this.opacity > 0) {
                this.xPos = this.updateXPos(this.xPos, NightMode.config.MOON_SPEED);

                // Update stars.
                if (this.drawStars) {
                    for (var i = 0; i < NightMode.config.NUM_STARS; i++) {
                        this.stars[i].x = this.updateXPos(this.stars[i].x,
                            NightMode.config.STAR_SPEED);
                    }
                }
                this.draw();
            } else {
                this.opacity = 0;
                this.placeStars();
            }
            this.drawStars = true;
        },

        updateXPos: function (currentPos, speed) {
            if (currentPos < -NightMode.config.WIDTH) {
                currentPos = this.containerWidth;
            } else {
                currentPos -= speed;
            }
            return currentPos;
        },

        draw: function () {
            // moonOutputWidth stays at 1x (it's the on-screen render size);
            // everything else is a source-rect coordinate into the 2x/HDPI
            // spritesheet, so it's computed once directly at that scale
            // rather than at 1x and then immediately doubled/overwritten.
            var moonBaseWidth = this.currentPhase == 3 ? NightMode.config.WIDTH * 2 :
                NightMode.config.WIDTH;
            var moonOutputWidth = moonBaseWidth;
            var moonSourceWidth = moonBaseWidth * 2;
            var moonSourceHeight = NightMode.config.HEIGHT * 2;
            var moonSourceX = this.spritePos.x +
                (NightMode.phases[this.currentPhase] * 2);
            var starSize = NightMode.config.STAR_SIZE * 2;
            var starSourceX = Runner.spriteDefinition.HDPI.STAR.x;

            this.canvasCtx.save();
            this.canvasCtx.globalAlpha = this.opacity;

            // Stars:
            if (this.drawStars) {
                var starImg = Runner.getSpriteImage('STAR');
                for (var i = 0; i < NightMode.config.NUM_STARS; i++) {
                    this.canvasCtx.drawImage(starImg,
                        starSourceX, this.stars[i].sourceY, starSize, starSize,
                        Math.round(this.stars[i].x), this.stars[i].y,
                        NightMode.config.STAR_SIZE, NightMode.config.STAR_SIZE);
                }
            }
            
            // Moon:
            var moonImg = Runner.getSpriteImage('MOON');
            this.canvasCtx.drawImage(moonImg, moonSourceX,
                this.spritePos.y, moonSourceWidth, moonSourceHeight,
                Math.round(this.xPos), this.yPos,
                moonOutputWidth, NightMode.config.HEIGHT);

            this.canvasCtx.globalAlpha = 1;
            this.canvasCtx.restore();
        },

        // Do star placement.
        placeStars: function () {
            var segmentSize = Math.round(this.containerWidth /
                NightMode.config.NUM_STARS);

            for (var i = 0; i < NightMode.config.NUM_STARS; i++) {
                this.stars[i] = {};
                this.stars[i].x = getRandomNum(segmentSize * i, segmentSize * (i + 1));
                this.stars[i].y = getRandomNum(0, NightMode.config.STAR_MAX_Y);

                this.stars[i].sourceY = Runner.spriteDefinition.HDPI.STAR.y +
                    NightMode.config.STAR_SIZE * 2 * i;
            }
        },

        reset: function () {
            this.currentPhase = 0;
            this.opacity = 0;
            this.update(false);
            if (this.overlay) {
                this.overlay.style.opacity = '0';
            }
        }

    };


    //******************************************************************************

    function Particle(canvasCtx, x, y, opt_config) {
        this.canvasCtx = canvasCtx;
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * (opt_config.speed || 4);
        this.vy = (Math.random() - 0.5) * (opt_config.speed || 4) - (opt_config.upward || 1);
        this.size = opt_config.size || 3;
        this.color = opt_config.color || '#ff4444';
        this.life = 0;
        this.maxLife = opt_config.life || getRandomNum(400, 800);
        this.gravity = opt_config.gravity || 0.2;
        this.isFirework = opt_config.isFirework || false;
    }

    Particle.prototype = {
        update: function (deltaTime) {
            this.life += deltaTime;
            this.x += this.vx * (deltaTime / 16);
            this.y += this.vy * (deltaTime / 16);
            if (!this.isFirework) {
                this.vy += this.gravity * (deltaTime / 16);
            }
            this.draw();
        },
        draw: function () {
            var alpha = Math.max(0, 1 - (this.life / this.maxLife));
            this.canvasCtx.save();
            this.canvasCtx.globalAlpha = alpha;
            this.canvasCtx.fillStyle = this.color;
            this.canvasCtx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
            this.canvasCtx.restore();
        }
    };
	
    //******************************************************************************

    /**
     * Horizon Line.
     * Consists of two connecting lines. Randomly assigns a flat / bumpy horizon.
     * @param {HTMLCanvasElement} canvas
     * @param {Object} spritePos Horizon position in sprite.
     * @constructor
     */
    function HorizonLine(canvas, spritePos) {
        this.spritePos = spritePos;
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.sourceDimensions = {};
        this.dimensions = HorizonLine.dimensions;
        this.sourceXPos = [this.spritePos.x, this.spritePos.x +
            this.dimensions.WIDTH];
        this.xPos = [];
        this.yPos = 0;
        this.bumpThreshold = 0.5;

        this.setSourceDimensions();
        this.draw();
    };


    /**
     * Horizon line dimensions.
     * @enum {number}
     */
    HorizonLine.dimensions = {
        WIDTH: 600,
        HEIGHT: 12,
        YPOS: 227
    };


    HorizonLine.prototype = {
        /**
         * Set the source dimensions of the horizon line.
         */
        setSourceDimensions: function () {

            for (var dimension in HorizonLine.dimensions) {
                if (dimension != 'YPOS') {
                    this.sourceDimensions[dimension] =
                        HorizonLine.dimensions[dimension] * 2;
                }
                this.dimensions[dimension] = HorizonLine.dimensions[dimension];
            }

            this.xPos = [0, HorizonLine.dimensions.WIDTH];
            this.yPos = HorizonLine.dimensions.YPOS;
        },

        /**
         * Return the crop x position of a type.
         */
        getRandomType: function () {
            return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;
        },

        /**
         * Draw the horizon line.
         */
        draw: function () {
            var horizonImg = Runner.getSpriteImage('HORIZON');
            this.canvasCtx.drawImage(horizonImg, this.sourceXPos[0],
                this.spritePos.y,
                this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
                this.xPos[0], this.yPos,
                this.dimensions.WIDTH, this.dimensions.HEIGHT);
            
            this.canvasCtx.drawImage(horizonImg, this.sourceXPos[1],
                this.spritePos.y,
                this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
                this.xPos[1], this.yPos,
                this.dimensions.WIDTH, this.dimensions.HEIGHT);
        },

        /**
         * Update the x position of an indivdual piece of the line.
         * @param {number} pos Line position.
         * @param {number} increment
         */
        updateXPos: function (pos, increment) {
            var line1 = pos;
            var line2 = pos == 0 ? 1 : 0;

            this.xPos[line1] -= increment;
            this.xPos[line2] = this.xPos[line1] + this.dimensions.WIDTH;

            if (this.xPos[line1] <= -this.dimensions.WIDTH) {
                this.xPos[line1] += this.dimensions.WIDTH * 2;
                this.xPos[line2] = this.xPos[line1] - this.dimensions.WIDTH;
                this.sourceXPos[line1] = this.getRandomType() + this.spritePos.x;
            }
        },

        /**
         * Update the horizon line.
         * @param {number} deltaTime
         * @param {number} speed
         */
        update: function (deltaTime, speed) {
            var increment = Math.floor(speed * (FPS / 1000) * deltaTime);

            if (this.xPos[0] <= 0) {
                this.updateXPos(0, increment);
            } else {
                this.updateXPos(1, increment);
            }
            this.draw();
        },

        /**
         * Reset horizon to the starting position.
         */
        reset: function () {
            this.xPos[0] = 0;
            this.xPos[1] = HorizonLine.dimensions.WIDTH;
        }
    };


    //******************************************************************************

    /**
     * Horizon background class.
     * @param {HTMLCanvasElement} canvas
     * @param {Object} spritePos Sprite positioning.
     * @param {Object} dimensions Canvas dimensions.
     * @param {number} gapCoefficient
     * @constructor
     */
    function Horizon(canvas, spritePos, dimensions, gapCoefficient) {
        this.canvas = canvas;
        this.canvasCtx = this.canvas.getContext('2d');
        this.config = Horizon.config;
        this.dimensions = dimensions;
        this.gapCoefficient = gapCoefficient;
        this.obstacles = [];
        this.obstacleHistory = [];
        this.horizonOffsets = [0, 0];
        this.cloudFrequency = this.config.CLOUD_FREQUENCY;
        this.spritePos = spritePos;
        this.nightMode = null;

        // Cloud
        this.clouds = [];
        this.cloudSpeed = this.config.BG_CLOUD_SPEED;

        // Horizon
        this.horizonLine = null;
        this.init();
    };


    /**
     * Horizon config.
     * @enum {number}
     */
    Horizon.config = {
        BG_CLOUD_SPEED: 0.2,
        BUMPY_THRESHOLD: .3,
        CLOUD_FREQUENCY: .5,
        HORIZON_HEIGHT: 16,
        MAX_CLOUDS: 6
    };


    Horizon.prototype = {
        /**
         * Initialise the horizon. Just add the line and a cloud. No obstacles.
         */
        init: function () {
            this.addCloud();
            this.horizonLine = new HorizonLine(this.canvas, this.spritePos.HORIZON);
            this.nightMode = new NightMode(this.canvas, this.spritePos.MOON,
                this.dimensions.WIDTH);
        },

        /**
         * @param {number} deltaTime
         * @param {number} currentSpeed
         * @param {boolean} updateObstacles Used as an override to prevent
         *     the obstacles from being updated / added. This happens in the
         *     ease in section.
         * @param {boolean} showNightMode Night mode activated.
         */
        update: function (deltaTime, currentSpeed, updateObstacles, showNightMode) {
            this.runningTime += deltaTime;
            this.horizonLine.update(deltaTime, currentSpeed);
            this.nightMode.update(showNightMode);
            this.updateClouds(deltaTime, currentSpeed);

            if (updateObstacles) {
                this.updateObstacles(deltaTime, currentSpeed);
            }
        },

        /**
         * Update the cloud positions.
         * @param {number} deltaTime
         * @param {number} currentSpeed
         */
        updateClouds: function (deltaTime, speed) {
            var cloudSpeed = this.cloudSpeed / 1000 * deltaTime * speed;
            var numClouds = this.clouds.length;

            if (numClouds) {
                for (var i = numClouds - 1; i >= 0; i--) {
                    this.clouds[i].update(cloudSpeed);
                }

                var lastCloud = this.clouds[numClouds - 1];

                // Check for adding a new cloud.
                if (numClouds < this.config.MAX_CLOUDS &&
                    (this.dimensions.WIDTH - lastCloud.xPos) > lastCloud.cloudGap &&
                    this.cloudFrequency > Math.random()) {
                    this.addCloud();
                }

                // Remove expired clouds.
                this.clouds = this.clouds.filter(function (obj) {
                    return !obj.remove;
                });
            } else {
                this.addCloud();
            }
        },

        /**
         * Update the obstacle positions.
         * @param {number} deltaTime
         * @param {number} currentSpeed
         */
        updateObstacles: function (deltaTime, currentSpeed) {
            // Obstacles, move to Horizon layer.
            var updatedObstacles = this.obstacles.slice(0);

            for (var i = 0; i < this.obstacles.length; i++) {
                var obstacle = this.obstacles[i];
                obstacle.update(deltaTime, currentSpeed);

                // Clean up existing obstacles.
                if (obstacle.remove) {
                    updatedObstacles.shift();
                }
            }
            this.obstacles = updatedObstacles;

            if (this.obstacles.length > 0) {
                var lastObstacle = this.obstacles[this.obstacles.length - 1];

                if (lastObstacle && !lastObstacle.followingObstacleCreated &&
                    lastObstacle.isVisible() &&
                    (lastObstacle.xPos + lastObstacle.width + lastObstacle.gap) <
                    this.dimensions.WIDTH) {
                    this.addNewObstacle(currentSpeed);
                    lastObstacle.followingObstacleCreated = true;
                }
            } else {
                // Create new obstacles.
                this.addNewObstacle(currentSpeed);
            }
        },

        removeFirstObstacle: function () {
            this.obstacles.shift();
        },

        /**
         * Add a new obstacle.
         * @param {number} currentSpeed
         */
        addNewObstacle: function (currentSpeed) {
            var obstacleTypeIndex = getRandomNum(0, Obstacle.types.length - 1);
            var obstacleType = Obstacle.types[obstacleTypeIndex];

            // Check for multiples of the same type of obstacle.
            // Also check obstacle is available at current speed.
            if (this.duplicateObstacleCheck(obstacleType.type) ||
                currentSpeed < obstacleType.minSpeed) {
                this.addNewObstacle(currentSpeed);
            } else {
                var obstacleSpritePos = this.spritePos[obstacleType.type];

                var newObstacle = new Obstacle(this.canvasCtx, obstacleType,
                    obstacleSpritePos, this.dimensions,
                    this.gapCoefficient, currentSpeed, obstacleType.width);
			    
                // 1% chance to convert a Pterodactyl spawn into a UFO
                if (obstacleType.type === 'PTERODACTYL' && Math.random() < Runner.config.UFO_PROBABILITY) {
                    newObstacle.isUfo = true;
                    newObstacle.collisionBoxes = [
                        new CollisionBox(2, 14, 42, 16),
                        new CollisionBox(14, 4, 18, 12)
                    ];
                }
			    
                // 1% chance to convert a single small cactus into Bigfoot
                if (obstacleType.type === 'CACTUS_SMALL' && newObstacle.size === 1 && Math.random() < Runner.config.BIGFOOT_PROBABILITY) {
                    newObstacle.isBigfoot = true;
                    // Upright humanoid collision box (width: 17, height: 35)
                    newObstacle.collisionBoxes = [
                        new CollisionBox(2, 2, 13, 33)
                    ];
                }
			    
                this.obstacles.push(newObstacle);

                this.obstacleHistory.unshift(obstacleType.type);

                if (this.obstacleHistory.length > 1) {
                    this.obstacleHistory.splice(Runner.config.MAX_OBSTACLE_DUPLICATION);
                }
            }
        },

        /**
         * Returns whether the previous two obstacles are the same as the next one.
         * Maximum duplication is set in config value MAX_OBSTACLE_DUPLICATION.
         * @return {boolean}
         */
        duplicateObstacleCheck: function (nextObstacleType) {
            var duplicateCount = 0;

            for (var i = 0; i < this.obstacleHistory.length; i++) {
                duplicateCount = this.obstacleHistory[i] == nextObstacleType ?
                    duplicateCount + 1 : 0;
            }
            return duplicateCount >= Runner.config.MAX_OBSTACLE_DUPLICATION;
        },

        /**
         * Reset the horizon layer.
         * Remove existing obstacles and reposition the horizon line.
         */
        reset: function () {
            this.obstacles = [];
            this.horizonLine.reset();
            this.nightMode.reset();
        },

        /**
         * Update the canvas width and scaling.
         * @param {number} width Canvas width.
         * @param {number} height Canvas height.
         */
        resize: function (width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
        },

        /**
         * Add a new cloud to the horizon.
         */
        addCloud: function () {
            this.clouds.push(new Cloud(this.canvas, this.spritePos.CLOUD,
                this.dimensions.WIDTH));
        }
    };
})();


function onDocumentLoad() {
    new Runner('.interstitial-wrapper');
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);

    function speakQuote(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            var utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    }
