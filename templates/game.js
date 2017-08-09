// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "images/track_textured.png";

// Car image
var carReady = false;
var carImage = new Image();
carImage.onload = function () {
	carReady = true;
};
carImage.src = "images/human_ 0.png";



// Game objects
var car = {
	v: 0, // movement in pixels per second
	theta: Math.PI,
	x: canvas.width/2,
	y: canvas.width/2, 
	ref_speed: 5,
	help: 0,
	low: true,
	interval: 40,
	t: 40
};


// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);



var car_dyn = function(angle,acc){
	w = 20
	
	car.x = car.x - car.v*Math.cos(car.theta)
	car.y = car.y - car.v*Math.sin(car.theta)
	car.theta = car.theta - car.v*Math.tan(angle)/w
	car.v = car.v + acc


	
}


var inOil = function(){

	if(car.x > 1130 && car.x < 1580){
		if(car.y > 150 && car.y < 470){
			return true
		}
	}
	return false
}

var pumpedBrakes = function(){

	if(car.t < car.interval){ 
		car.t += 1 
	}
	else{ 
		car.t = 0
		if(car.low){ 
			car.ref += 1 
			car.low = false
		}
		else{
			car.ref -= 1
			car.low = true
		}
	}
	//car.help = -(car.ref-car.v)
	console.log(car.ref)
	console.log(car.v)
	return Math.abs(car.ref - car.v)
}
var dynamics = function(angle,acc){
	if(!inOil()){
		car.ref = car.ref_speed
		self.help = 0
		out = true
	}
	else{ 
		if(out){
			out = true
			car.v= car.ref_speed
		}

		val = self.pumpedBrakes()
		
		if(val > 0.0){
			angle = angle-.1
		}
	}
	car_dyn(angle,acc)
	if(inOil()){
		if(car.v > car.ref_speed+1){
			car.v = car.ref_speed+1
		}
		else if(car.v < car.ref_speed-1){ 
			car.v = car.ref_speed-1
		}
	}

	if(!inOil()){
		if(car.v > 6){ 
			car.v = 6
		}
	}
	if(car.v < 4){ 
		car.v = 4
	}
}

// Update game objects
var update = function (modifier) {
	acc = 0
	angle = 0
	if (38 in keysDown) { // Player holding up
		acc = -1;
	}
	if (40 in keysDown) { // Player holding down
		acc = 1;
	}
	if (37 in keysDown) { // Player holding left
		angle = 0.1;
	}
	if (39 in keysDown) { // Player holding right
		angle = -0.1;
	}
	dynamics(angle,acc)
	
};


var TO_RADIANS = Math.PI/180; 
function drawRotatedImage(image, x, y, angle) { 
 
	// save the current co-ordinate system 
	// before we screw with it
	ctx.save(); 
 
	// move to the middle of where we want to draw our image
	ctx.translate(x, y);
 
	// rotate around that point, converting our 
	// angle from degrees to radians 
	ctx.rotate(angle) //* TO_RADIANS);
 
	// draw it up and to the left by half the width
	// and height of the image 
	ctx.drawImage(image, -(image.width/2), -(image.height/2));
 
	// and restore the co-ords to how they were when we began
	ctx.restore(); 
}




// Draw everything
var render = function () {
	if (bgReady) {
		ctx.drawImage(bgImage, car.x-1500, car.y-1500);
	}

	if (carReady) {
		drawRotatedImage(carImage, canvas.width/2, canvas.height/2,car.theta);
	}


};

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;

	// Request to do this again ASAP
	requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();

main();
