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
    renderer.setClearColor(0x000000, 1); 
    
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
	nbodyManager = new NBodyManager(500);
	nbodyManager.initBodies();
}


function animate() {
	
	//for (var i = 0 ; i < 10 ; i++) {
		nbodyManager.calculateTimeStep();
	//}
	
	nbodyManager.updateView();
	
	renderer.render(scene, camera);
	requestAnimationFrame(animate);		
}


function NBodyManager(numberOfBodies) {

	this.bodyModelList = [];
	this.nbodySystemView = new NBodySystemView();
	
	this.initBodies = function() {	
		var stateVectorList = [];
	
		for (var i = 0 ; i < 250 ; i++) {
			var rRandom = Math.random() * 5;
			var thetaRandom = 2 * Math.random() * Math.PI;
			var vel = 0;//Math.sqrt(500 / rRandom);
			
			var posVect = [5 + rRandom * Math.cos(thetaRandom), 5 + rRandom * Math.sin(thetaRandom)];
			var velVect = [-vel * Math.sin(thetaRandom), vel * Math.cos(thetaRandom)];
			
			stateVectorList.push([posVect, velVect]);
		}
		
		for (var i = 0 ; i < 250 ; i++) {
			var rRandom = Math.random() * 5;
			var thetaRandom = 2 * Math.random() * Math.PI;
			var vel = 0;//Math.sqrt(500 / rRandom);
			
			var posVect = [-5 + rRandom * Math.cos(thetaRandom), -5 + rRandom * Math.sin(thetaRandom)];
			var velVect = [-vel * Math.sin(thetaRandom), vel * Math.cos(thetaRandom)];
			
			stateVectorList.push([posVect, velVect]);
		}
	
		for (var i = 0 ; i < numberOfBodies ; i++) {
			var bodyModel = new BodyModel();
			
			bodyModel.bodyIndex = i;
			bodyModel.posVect = stateVectorList[i][0];
			bodyModel.velVect = stateVectorList[i][1];
			bodyModel.GM = 1e11 * 6.67385e-11
			bodyModel.integrator = new EulerIntegrator(0.001);

			this.bodyModelList.push(bodyModel);
			this.nbodySystemView.particleSystem.geometry.vertices.push(new THREE.Vector3(0, 0, 0));	
		}
		
		for (var i = 0 ; i < numberOfBodies ; i++) {
			this.bodyModelList[i].bodyModelList = this.bodyModelList;
		}
		
		this.nbodySystemView.bodyModelList = this.bodyModelList;	
		this.nbodySystemView.addToScene();	
	}
	
	this.calculateTimeStep = function() {		
		for (var i = 0 ; i < numberOfBodies ; i++) {
			this.bodyModelList[i].move();
		}
	}
	
	this.updateView = function() {
		this.nbodySystemView.updatePositions();	
	}
	
}


function NBodySystemView() {

	this.bodyModelList;
	this.particleSystem = new THREE.ParticleSystem(
		new THREE.Geometry(),
		new THREE.ParticleBasicMaterial({size: 0.2}));
	
	this.addToScene = function() {	
		scene.add(this.particleSystem);	
	}
	
	this.updatePositions = function() {				
		var numberOfBodies = this.bodyModelList.length;

		for (var i = 0 ; i < numberOfBodies ; i++) {
			var body = this.bodyModelList[i];
			var particle = this.particleSystem.geometry.vertices[i];

			particle.set(body.posVect[0], body.posVect[1], 0);
		}		

		this.particleSystem.geometry.verticesNeedUpdate = true;
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

}


function EulerIntegrator(dt) {

	this.integrate = function(bodyModel) {
		var x1 = bodyModel.posVect;
		var v1 = bodyModel.velVect;
		var a1 = bodyModel.accel(x1, v1);
		
		var posVect = [x1[0] + v1[0] * dt, x1[1] + v1[1] * dt];
		var velVect = [v1[0] + a1[0] * dt, v1[1] + a1[1] * dt];
		
		return [posVect, velVect];
	}
	
}


function RK4Integrator(dt) {

	this.integrate = function(bodyModel) {
		var x1, x2, x3, x4;
		var v1, v2, v3, v4;
		var a1, a2, a3, a4;

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





