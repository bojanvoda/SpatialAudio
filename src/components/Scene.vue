<template>
	<div id="scene-container">
	<!-- <router-link to="/img01">PhotoGallery</router-link> -->
	<div id="blocker">
		<div id="instructions">
			<p style="font-size:36px">
				Click to play
			</p>
			<p>
				Move: WASD<br/>
				Jump: SPACE<br/>
				Look: MOUSE
			</p>
		</div>
	</div>
	<div class = "pop-up"><div class = "text"></div></div>
		<div className="dot"></div>
	<div id = "overlay">
		<button id ="startButton">
			Start Scene
		</button>
	</div>
	</div>
  </template>

  <script type = "module" defer>
  
  import * as THREE from 'three'
  //import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
  import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
  //import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls'
  //import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
  //import Stats from 'stats.js'
  
  import StarrySkyShader from '../controls/StarrySkyShader.js'
  //import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
  import { Octree } from 'three/examples/jsm/math/Octree.js'
  //import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper'
  import { Capsule } from 'three/examples/jsm/math/Capsule.js'
  import Stats from 'three/examples/jsm/libs/stats.module.js';
  
  import { PositionalAudioHelper } from 'three/examples/jsm/helpers/PositionalAudioHelper.js';
  
  export default {
  name: 'Scene',
mounted: function() {
	
	function main(){
	
	const overlay = document.getElementById( 'overlay' );
	overlay.remove();
		
/* eslint-enable no-mixed-spaces-and-tabs */ 

	let material1, material2, material3;
	const clock = new THREE.Clock();
	const scene = new THREE.Scene();
	const loadingManager = new THREE.LoadingManager( () => {
	
		const loadingScreen = document.getElementById( 'loading-screen' );
		loadingScreen.classList.add( 'fade-out' );
		// optional: remove loader from DOM via event listener
		loadingScreen.addEventListener( 'transitionend', onTransitionEnd );
		
	} );
	const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.rotation.order = 'YXZ';

	// LIGHTS ---
	const fillLight1 = new THREE.HemisphereLight( 0x404040, 0x002244, 0.4);
	fillLight1.position.set( 2, 1, 1 );
	scene.add( fillLight1 );
	
	const directionalLight = new THREE.DirectionalLight( 0x404040 , 0.9 );
	directionalLight.position.set( 0 , 6,  0 );
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 1024;
	directionalLight.shadow.mapSize.height = 1024;
	directionalLight.shadow.radius = 4;
	directionalLight.shadow.bias = - 0.00006;
	scene.add( directionalLight ); 

	const pointLight2 = new THREE.AmbientLight( 0x404040, 0.4 );
	pointLight2.position.set(4,4, 15)
	//pointLight2.castShadow = true;
	scene.add(pointLight2); 
	const pointLight3 = new THREE.AmbientLight(0x404040, 0.4);
	pointLight3.position.set(-4,-8,-15)
	scene.add(pointLight3);

	const container = document.getElementById( 'container' );
	const listener = new THREE.AudioListener();
	camera.add(listener);
	const renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.VSMShadowMap;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	container.appendChild( renderer.domElement );

	const stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	// Starry Sky Shader & elements
	var skyDomeRadius = 500.01;
	var sphereMaterial1 = new THREE.ShaderMaterial({
	uniforms: {
		skyRadius: { value: skyDomeRadius },
		env_c1: { value: new THREE.Color("#0d1a2f") },
		env_c2: { value: new THREE.Color("#0f8682") },
		noiseOffset: { value: new THREE.Vector3(100.01, 100.01, 100.01) },
		starSize: { value: 0.01 },
		starDensity: { value: 0.01 },
		clusterStrength: { value: 1.6 },
		clusterSize: { value: 0.2 },
		time: { value: 0 }
	},
	vertexShader: StarrySkyShader.vertexShader,
	fragmentShader: StarrySkyShader.fragmentShader,
	side: THREE.DoubleSide,
	})
	var sphereGeometry1 = new THREE.SphereGeometry(skyDomeRadius, 20, 20);
	var skyDome = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
	scene.add(skyDome);
	

	const GRAVITY = 30;
	const NUM_SPHERES = 100;
	const SPHERE_RADIUS = 0.2;
	const STEPS_PER_FRAME = 5;
	const sphereGeometry = new THREE.IcosahedronGeometry( SPHERE_RADIUS, 5 );
	const sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xbbbb44 } );

	const spheres = [];
	for ( let i = 0; i < NUM_SPHERES; i ++ ) {
		const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
		sphere.castShadow = true;
		sphere.receiveShadow = true;
		scene.add( sphere );
		spheres.push( {
			mesh: sphere,
			collider: new THREE.Sphere( new THREE.Vector3( 0, - 100, 0 ), SPHERE_RADIUS ),
			velocity: new THREE.Vector3()
		} );

	}

	const worldOctree = new Octree();
	// player positioning & making a capsule that creates a player
	const playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 3.4, 0 ), 0.35 );
	const playerVelocity = new THREE.Vector3();
	const playerDirection = new THREE.Vector3();
	let playerOnFloor = false;
	//let mouseTime = 0;
	const keyStates = {};
	const radius = 1.5; // adjust to your desired size
	const sphere = new THREE.SphereGeometry( radius, 32, 32 );

	material1 = new THREE.MeshPhongMaterial( { color: 0xffaa00, flatShading: true, shininess: 0 } );
	material2 = new THREE.MeshPhongMaterial( { color: 0xff2200, flatShading: true, shininess: 0 } );
	material3 = new THREE.MeshPhongMaterial( { color: 0x6622aa, flatShading: true, shininess: 0 } );

	// sound spheres
	const mesh1 = new THREE.Mesh( sphere, material1 );
	mesh1.position.set( - 50, 3, 3 );
	scene.add( mesh1 );
	const izbrishi = new THREE.Mesh( sphere, material3);
	izbrishi.position.set(-10,-10,-10);
	/*const sound1 = new THREE.PositionalAudio( listener );
	const songElement = document.getElementById( 'song' );
	sound1.setMediaElementSource( songElement );
	sound1.setRefDistance( 20 );
	sound1.setVolume( 0.1 );
	songElement.play();
	mesh1.add( sound1 );*/

	/*const mesh2 = new THREE.Mesh( sphere, material2 );
	mesh2.position.set( 50, 3, 3);
	scene.add( mesh2 );*/
	

	//const sound2 = new THREE.PositionalAudio( listener );
	//const skullbeatzElement = document.getElementById( 'skullbeatz' );
	//sound2.setMediaElementSource( skullbeatzElement );
	//sound2.setRefDistance( 1 );
	//sound2.setDirectionalCone( 360, 360, 0.01 );
	//sound2.setVolume(2.9);
	//skullbeatzElement.play();
	//mesh2.add( sound2 );

	/*const sound2 = new THREE.PositionalAudio(listener);
	const audioLoader = new THREE.AudioLoader();
	audioLoader.load('./../assets/Ectoplasm.mp3', function(buffer) {
	sound2.setBuffer(buffer);
	sound2.setRefDistance(0.1);
	sound2.setVolume(0.3);
	sound2.setMaxDistance(0.2);
	//sound2.setLoop(false);
	//sound2.setMaxDistance(1000);
	//sound2.play();
	//mesh2.add(sound2);
	});*/

	const mesh8 = new THREE.Mesh( sphere, material2 );
	mesh8.position.set(60, 2.8, 37);

	const sound2 = new THREE.PositionalAudio( listener );
	const skullbeatzElement = document.getElementById( 'skullbeatz' );
	sound2.setMediaElementSource( skullbeatzElement );
	sound2.setRefDistance( 1 );
	sound2.setDirectionalCone( 360, 360, 0.01 );
	sound2.setVolume(0.9);
	sound2.setLoop(false);
	skullbeatzElement.play();
	mesh8.add( sound2 );





	const helper = new PositionalAudioHelper( sound2, 0.5 );
	sound2.add( helper );

	/*const mesh3 = new THREE.Mesh( sphere, material3 );
	mesh3.position.set( 20, 4, 3);
	scene.add( mesh3 );*/

	/*const sound4 = new THREE.Audio( listener );
	const utopiaElement = document.getElementById( 'utopia' );
	sound4.setMediaElementSource( utopiaElement );
	sound4.setVolume( 0.1 );*/

	/*const SoundControls = function () {
	this.master = listener.getMasterVolume();
	this.secondSphere = sound2.getVolume();
	this.Ambient = sound4.getVolume();
	};*/
	// -- 
	var x = -11;
	var z = -11;
	var increment = 12;
	var startingX = 12;
	
	//const mesh8 = new THREE.Mesh( sphere, material2 );
	//mesh8.position.set(60, 2.8, 37);

	for (let i = 0; i < 20; i++) {
	const mesh = new THREE.Mesh( sphere, material2 );
	mesh.position.set(x, 2.8, z);
	scene.add(mesh);
	x += increment;
	if (i % 5 === 0) {
		z += increment;
		x = startingX;
	}
	else if (i === 8) { // or any other iteration you want to add audio to
	//const mesh8 = new THREE.Mesh( sphere, material2 );
	mesh8.name = "8th mesh"
	scene.add(mesh8);
	//mesh8.position.set(60, 2.8, 37);
	//mesh8.add( sound2 );
	}
	}
	// --

	//- interakcija 
	
	
	/*const gui = new GUI();
	const soundControls = new SoundControls();
	const volumeFolder = gui.addFolder( 'sound volume' );

	volumeFolder.add( soundControls, 'master' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
	listener.setMasterVolume( soundControls.master );
	} );
	volumeFolder.add( soundControls, 'secondSphere' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
	sound2.setVolume( soundControls.secondSphere );
	} );
	volumeFolder.open();*/

	document.addEventListener('keydown', (event) => {
	keyStates[ event.code ] = true;

		if (event.code === 'KeyF') { 
			// Check for 'f' key press
			// Check if 8th mesh is being intersected
			//var raycaster = new THREE.Raycaster();
			//var mouse = new THREE.Vector2();
			//mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			//mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
			raycaster.setFromCamera(mouse, camera);
			var intersects = raycaster.intersectObjects(scene.children);
			if (intersects.length > 0) {
				console.log("intesect")
				if (intersects[0].object.name === "8th mesh") {
					console.log("Right Mesh");
					var message = document.createElement("p");
					message.innerHTML = "Right Mesh";
					message.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; color: green;";
					document.body.appendChild(message);
					setTimeout(function(){
						message.remove();
					}, 2000);
				} else {
					console.log("Wrong Mesh");
					var msg = document.createElement("p");
					msg.innerHTML = "Wrong Mesh";
					msg.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; color: red;";
					document.body.appendChild(msg);
					setTimeout(function(){
						msg.remove();
					}, 2000);
				}
			}
		}
	});

	document.addEventListener( 'keyup', ( event ) => {
		keyStates[ event.code ] = false;
	} );

	container.addEventListener( 'mousedown', () => {
		document.body.requestPointerLock();
		performance.now();
	} );

	document.addEventListener( 'mouseup', () => {
		if ( document.pointerLockElement !== null ) onClick();
	} );

	document.body.addEventListener( 'mousemove', ( event ) => {

		if ( document.pointerLockElement === document.body ) {
			onHover();
			camera.rotation.y -= event.movementX / 500;
			camera.rotation.x -= event.movementY / 500;
		}
	} );

	const controls1 = new PointerLockControls( camera, document.body );
	const blocker = document.getElementById( 'blocker' );
	const instructions = document.getElementById( 'instructions' );

	instructions.addEventListener( 'click', function (e) {
		controls1.lock();
		e.stopPropagation();
	} );

	controls1.addEventListener( 'lock', function () {
		instructions.style.display = 'none';
		blocker.style.display = 'none';
		const skullbeatzElement = document.getElementById( 'skullbeatz' );
		skullbeatzElement.play();
	} );

	controls1.addEventListener( 'unlock', function () {
		blocker.style.display = 'block';
		instructions.style.display = '';
		const skullbeatzElement = document.getElementById( 'skullbeatz' );
		skullbeatzElement.pause();
	} );

	window.addEventListener( 'resize', onWindowResize );

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}

	

	function playerCollisions() {
		const result = worldOctree.capsuleIntersect( playerCollider );
		playerOnFloor = false;
		if ( result ) {
			playerOnFloor = result.normal.y > 0;
			if ( ! playerOnFloor ) {
				playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );
			}
			playerCollider.translate( result.normal.multiplyScalar( result.depth  ) );
		}
	}

	function updatePlayer( deltaTime ) {
		let damping = Math.exp( - 4 * deltaTime ) - 1;
		if ( ! playerOnFloor ) {
			playerVelocity.y -= GRAVITY * deltaTime;
			// small air resistance
			damping *= 0.1;
		}
		
		playerVelocity.addScaledVector( playerVelocity, damping );
		const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
		playerCollider.translate( deltaPosition );
		playerCollisions();
		camera.position.copy( playerCollider.end );
	}
	function onTransitionEnd( event ) {
	event.target.remove();
	}

	// tukaj vzamemo direkcijo playera oz. direct & side pozicije za preverjanje collisiona
	function getForwardVector() {
		camera.getWorldDirection( playerDirection );
		playerDirection.y = 0;
		playerDirection.normalize();
		return playerDirection;
	}

	function getSideVector() {
		camera.getWorldDirection( playerDirection );
		playerDirection.y = 0;
		playerDirection.normalize();
		playerDirection.cross( camera.up );
		return playerDirection;

	}

	function controls( deltaTime ) {
		// gives a bit of air control & here we create the speed of movement inside the scene 
		const speedDelta = deltaTime * ( playerOnFloor ? 25 : 8 );
		if ( keyStates[ 'KeyW' ] ) {
			playerVelocity.add( getForwardVector().multiplyScalar( speedDelta ) );
		}
		if ( keyStates[ 'KeyS' ] ) {
			playerVelocity.add( getForwardVector().multiplyScalar( - speedDelta ) );
		}
		if ( keyStates[ 'KeyA' ] ) {
			playerVelocity.add( getSideVector().multiplyScalar( - speedDelta ) );
		}
		if ( keyStates[ 'KeyD' ] ) {
			playerVelocity.add( getSideVector().multiplyScalar( speedDelta ) );
		}
	}

	const loader = new GLTFLoader(loadingManager).setPath( '/three-assets/' );
	loader.load( 'sound_room.glb', ( gltf ) => {
		scene.add( gltf.scene );
		worldOctree.fromGraphNode( gltf.scene );
		gltf.scene.traverse( child => {
			if ( child.isMesh ) {
				child.castShadow = true;
				child.receiveShadow = true;
				if ( child.material.map ) {
					child.material.map.anisotropy = 4;
				}
			}
		} );
		animate();
	} );
	const raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
	const mouse = new THREE.Vector2()

	function onHover(){
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	raycaster.setFromCamera( mouse, camera);
	}

	function onClick() {
	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	raycaster.setFromCamera( mouse, camera);
}

	function teleportPlayerIfOob() {
		if ( camera.position.y <= - 25 ) {
			playerCollider.start.set( 0, 0.35, 0 );
			playerCollider.end.set( 0, 3.4, 0 );
			// playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 3.4, 0 ), 0.35 );
			playerCollider.radius = 0.35;
			camera.position.copy( playerCollider.end);
			camera.rotation.set( 0, 0, 0 );
		}
	}
	
	
	function animate() {
		const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;
		// we look for collisions in substeps to decrease the risk of an object traversing another too quickly for detection.
		if ( controls1.isLocked === true ) {
		for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {
			//const distance = camera.position.distanceTo(mesh8);
			controls( deltaTime );
			updatePlayer( deltaTime );
			teleportPlayerIfOob();
			/*let volume = 1;
			if (distance > 50) {
			volume = 0.1;
			} else if (distance > 20) {
			volume = 0.5;
			}
			sound2.setVolume(volume);*/
		}
		camera.updateProjectionMatrix();
		}
		//sphereMaterial.uniforms.time.value = clock.getElapsedTime();
		renderer.render( scene, camera );
		stats.update();
		requestAnimationFrame( animate );
	}
	}
	
	const startButton = document.getElementById( 'startButton' );
	startButton.addEventListener( 'click', main );
	//main();
  }
  }
  
  </script>
  <!-- Add "scoped" attribute to limit CSS to this component only -->
  <style scoped>
  .hovered {
	cursor: help;
  }
  
  .label {
	color: #fff;
	font-family: sans-serif;
	padding: 2px;
	background: rgba(0, 0, 0, 0.6);
  }
  .blocker {
	position: absolute;
	width: 100%;
	height: 100%;
	background-color: rgba(0,0,0,0.5);
	}

   instructions {
	width: 100%;
	height: 100%;

	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;

	text-align: center;
	font-size: 14px;
	cursor: pointer;
	}
  
  </style>