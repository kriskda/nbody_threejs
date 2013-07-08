var renderer;
var scene;
var camera;

var nbodyManager;


init();
animate();


function init() {
	initRenderer();
	initScene();
	initCamera();
	initLight();
	initNBody();
}


function initRenderer() {
	renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(800, 600);  
    renderer.setClearColor(0xEEEEEE, 1); 
    
    document.body.appendChild(renderer.domElement);
}


function initScene() {
	scene = new THREE.Scene();
}


function initCamera() {
	camera = new THREE.PerspectiveCamera(75, 800 / 600, 1, 1000);
	camera.position.set(0, 0, 30);	
}


function initLight() {
	var light = new THREE.PointLight(0xFFFF00);
    light.position.set(300, 300, 10);
    scene.add(light);	
}


function initNBody() {
	nbodyManager = new NBodyManager(1500);
	nbodyManager.initBodies();
}


function animate() {
	nbodyManager.calculateTimeStep();
	
	requestAnimationFrame(animate);	
	renderer.render(scene, camera);
}


function NBodyManager(numberOfBodies) {

	this.bodyModelList = [];
	
	this.initBodies = function() {
	
		for (var i = 0 ; i < numberOfBodies ; i++) {
			var xRandom = Math.random() * 20 - 10;
			var yRandom = Math.random() * 20 - 10;

			var bodyView = new BodyView();					
			var bodyModel = new BodyModel();
			
			bodyModel.bodyIndex = i;
			bodyModel.bodyView = bodyView;
			bodyModel.posVect = [xRandom, yRandom];
			bodyModel.velVect = [0, 0];
			bodyModel.GM = 1e10 * 6.67385e-11
			bodyModel.integrator = new Integrator();
			
			bodyView.addToScene();	
			
			this.bodyModelList.push(bodyModel);
		}
		
		for (var i = 0 ; i < numberOfBodies ; i++) {
			this.bodyModelList[i].bodyModelList = this.bodyModelList;
		}
		
	}
	
	this.calculateTimeStep = function() {
		
		for (var i = 0 ; i < numberOfBodies ; i++) {
			this.bodyModelList[i].move();
			this.bodyModelList[i].updateView();
		}
		
	}
	
}


function BodyView() {
	
	this.sphere = new THREE.Mesh(
			new THREE.SphereGeometry(0.1, 1, 1), 
			new THREE.MeshPhongMaterial({color: 0x000000}));	
	
	this.addToScene = function() {	
		scene.add(this.sphere);	
	}
	
	this.updatePosition = function(posVect) {		
		this.sphere.position.set(posVect[0], posVect[1], 0);
	}
	
}


function BodyModel() {
	
	this.bodyIndex;
	this.posVect;
	this.velVect;
	this.GM;
	this.bodyModelList;
	this.integrator;
	this.dampingFactor = 0.01;
	
	this.accel = function(x, v) {
		var ax = 0;
		var ay = 0;
		
		var numberOfBodies = this.bodyModelList.length;

		for (var i = 0 ; i < numberOfBodies ; i++) {
			var body = this.bodyModelList[i];

			if (body.bodyIndex != this.bodyIndex) {
				var dX = x[0] - body.posVect[0];
				var dY = x[1] - body.posVect[1];
				var rt = Math.sqrt(dX * dX + dY * dY + this.dampingFactor);
				var commonPart = -this.GM / (rt * rt * rt);	

				ax = ax + commonPart * dX;
				ay = ay + commonPart * dY;
			}
		}

		return [ax, ay]
	}
	
	this.move =  function() {
		var stateVect = this.integrator.integrate(this);

		this.posVect = stateVect[0];
		this.velVect = stateVect[1];
	}
	
	this.updateView = function() {
		this.bodyView.updatePosition(this.posVect);
	}
	
}


function Integrator() {

	this.integrate = function(bodyModel) {
		var x1, x2, x3, x4;
		var v1, v2, v3, v4;
		var a1, a2, a3, a4;
		
		var dt = 0.01;
		
		x1 = bodyModel.posVect;
		v1 = bodyModel.velVect;
		a1 = bodyModel.accel(x1, v1);

		x2 = [x1[0] + 0.5 * v1[0] * dt, x1[1] + 0.5 * v1[1] * dt];
		v2 = [v1[0] + 0.5 * a1[0] * dt, v1[1] + 0.5 * a1[1] * dt];
		a2 = bodyModel.accel(x2, v2);
    
		x3= [x1[0] + 0.5 * v2[0] * dt, x1[1] + 0.5 * v2[1] * dt];
		v3= [v1[0] + 0.5 * a2[0] * dt, v1[1] + 0.5 * a2[1] * dt];
		a3 = bodyModel.accel(x3, v3);
    
		x4 = [x1[0] + v3[0] * dt, x1[1] + v3[1] * dt];
		v4 = [v1[0] + a3[0] * dt, x1[1] + v3[1] * dt];
		a4 = bodyModel.accel(x4, v4);
			
		var posVect = [x1[0] + (dt / 6.0) * (v1[0] + 2 * v2[0] + 2 * v3[0] + v4[0]), x1[1] + (dt / 6.0) * (v1[1] + 2 * v2[1] + 2 * v3[1] + v4[1])];
		var velVect = [v1[0] + (dt / 6.0) * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]), v1[1] + (dt / 6.0) * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1])];		
		
		return [posVect, velVect]
	}
	
}





