
// Skybox texture from: https://github.com/mrdoob/three.js/tree/master/examples/textures/cube/skybox

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

var all_feathers = new THREE.Object3D();
var main_feathers = new THREE.Object3D();
var middle_feathers = new THREE.Object3D();
var small_feathers = new THREE.Object3D();
var curveObject;
var mainFeatherCurve = new THREE.CubicBezierCurve3(
		new THREE.Vector3( 0, 0, 0 ),
		new THREE.Vector3( 1, 0, 0 ),
		new THREE.Vector3( 1.5, 0, -1 ),
		new THREE.Vector3( 2.5, 0, -0.9 )
	);
var mainFeatherGeometry = new THREE.Geometry();

var config = {
	color : "#ffae23",
	scale_x : 1,
	scale_y : 1,
	scale_z : 1,
	rotate_x : 0,
	rotate_y : 0,
	rotate_z : 0,
	flapping_speed : 1,
	flapping_motion : 1,
	distribution : 1,
	curvature : 0,
	wind_x : 0,
	wind_y : 0,
	wind_z : 0
}

var scene;
var featherGeo;

var windForce = new THREE.Vector3( 5, 0, 0 );

// called after the scene loads
function onLoad(framework) {
    scene = framework.scene;
    var camera = framework.camera;
    var renderer = framework.renderer;
    var gui = framework.gui;
    var stats = framework.stats;
	
	var light = new THREE.AmbientLight( 0x404040 ); // soft white light
	scene.add( light );

    // Basic Lambert white
    var lambertWhite = new THREE.MeshLambertMaterial({ color: 0x8e8e8e, side: THREE.DoubleSide, emissive: 0x0 });
	
	var lambertGray = new THREE.MeshLambertMaterial({ color: 0x555555, side: THREE.DoubleSide });
	
	var lambertBlack = new THREE.MeshLambertMaterial({ color: 0x393939, side: THREE.DoubleSide  });
	//lambertBlack.emissive = 0x181818;

    // Set light
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(1, 3, 2);
    directionalLight.position.multiplyScalar(10);

    // set skybox
    var loader = new THREE.CubeTextureLoader();
    var urlPrefix = '/images/skymap/';

    var skymap = new THREE.CubeTextureLoader().load([
        urlPrefix + 'px.jpg', urlPrefix + 'nx.jpg',
        urlPrefix + 'py.jpg', urlPrefix + 'ny.jpg',
        urlPrefix + 'pz.jpg', urlPrefix + 'nz.jpg'
    ] );

    scene.background = skymap;
	

		
	//Main Feather
	mainFeatherCurve = new THREE.CubicBezierCurve3(
		new THREE.Vector3( 0, 0, 0 ),
		new THREE.Vector3( 1, 0, 0 ),
		new THREE.Vector3( 1.5, 0, -1 ),
		new THREE.Vector3( 2.5, 0, -0.9 )
	);

	mainFeatherGeometry = new THREE.Geometry();
	mainFeatherGeometry.vertices = mainFeatherCurve.getPoints(24);

	var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );

	curveObject = new THREE.Line( mainFeatherGeometry, material );

    // load a simple obj mesh
    var objLoader = new THREE.OBJLoader();
    objLoader.load('/geo/feather.obj', function(obj) {

        featherGeo = obj.children[0].geometry;
				
		for (var i = 0; i < mainFeatherGeometry.vertices.length; i++) {

			var featherMesh = new THREE.Mesh(featherGeo, lambertBlack);
			featherMesh.name = "mainFeather";
			main_feathers.add(featherMesh);
			var j = mainFeatherGeometry.vertices.length-i-1;
			var p = mainFeatherGeometry.vertices[i];
			featherMesh.position.set(p.x,p.y,p.z);
			featherMesh.rotation.z = p.y;
			featherMesh.rotation.y = -(Math.PI/2) + lerp(0, Math.PI/2, i/mainFeatherGeometry.vertices.length);
			var scale = 0.5;
			featherMesh.scale.set(scale,scale,scale);
		}
		
		var numMiddleFeathers = mainFeatherGeometry.vertices.length/1.2;
		
		for (var i = 0; i < numMiddleFeathers; i++) {

			var featherMesh = new THREE.Mesh(featherGeo, lambertGray);
			featherMesh.name = "middleFeather";
			middle_feathers.add(featherMesh);
			var j = mainFeatherGeometry.vertices.length-i-1;
			var p = mainFeatherGeometry.vertices[i];	
			
			featherMesh.position.set(p.x,p.y+0.02,p.z);
			featherMesh.rotation.z = p.y;// * 1.3;
			featherMesh.rotation.y = -(Math.PI/2) + lerp(0, Math.PI/1.9, i/numMiddleFeathers);
			var scale = 0.3;
			featherMesh.scale.set(scale,scale,scale*2);

		}
		
		var numSmallFeathers = mainFeatherGeometry.vertices.length/2;
		
		
		for (var i = 0; i < numSmallFeathers; i++) {

			var featherMesh = new THREE.Mesh(featherGeo, lambertWhite);
			featherMesh.name = "smallFeather";
			small_feathers.add(featherMesh);
			var j = mainFeatherGeometry.vertices.length-i-1;
			var p = mainFeatherGeometry.vertices[i];
			
			featherMesh.position.set(p.x,p.y+0.04,p.z+0.05);
			featherMesh.rotation.z = p.y;// * 3;
			featherMesh.rotation.y = -(Math.PI/2) + lerp(0, Math.PI/1.8, i/numSmallFeathers);
			var scale = 0.2;
			featherMesh.scale.set(scale,scale,scale*3);

		}
    }); 
	
	
	all_feathers.add(main_feathers);
	all_feathers.add(middle_feathers);
	all_feathers.add(small_feathers);
	scene.add(all_feathers);

    // set camera position
    camera.position.set(0, 1, 5);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // scene.add(lambertCube);
    scene.add(directionalLight);

    // edit params and listen to changes like this
    // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
    gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
        camera.updateProjectionMatrix();
    });
	
	var f7 = gui.addFolder('Wind Speed');
	
	f7.add(config, 'wind_x').min(-10).max(10);		
	f7.add(config, 'wind_y').min(-10).max(10);	
	f7.add(config, 'wind_z').min(-10).max(10);
	
	
	var f6 = gui.addFolder('Wing Curve');
	
	f6.add(config, 'curvature').min(0.0).max(2);
	
	
	var f1 = gui.addFolder('Wing Color');

	
    f1.addColor(config, 'color').onChange( function(colorValue)
    {
		var colorObject = new THREE.Color(colorValue);

		var feathers = all_feathers.children[0];

		for(var j in feathers.children) {
			var feather = feathers.children[j];
			//feather.material.color = colorObject;	
			var lambertBlack = new THREE.MeshLambertMaterial({ color: colorValue, side: THREE.DoubleSide });
			feather.material = lambertBlack;

		}									
    });
	
	f1.addColor(config, 'color').onChange( function(colorValue)
    {
		var colorObject = new THREE.Color(colorValue);

		var feathers = all_feathers.children[1];

		for(var j in feathers.children) {
			var feather = feathers.children[j];
			var lambertBlack = new THREE.MeshLambertMaterial({ color: colorValue, side: THREE.DoubleSide });
			feather.material = lambertBlack;

		}									
    });
	
	f1.addColor(config, 'color').onChange( function(colorValue)
    {
		var colorObject = new THREE.Color(colorValue);

		var feathers = all_feathers.children[2];

		for(var j in feathers.children) {
			var feather = feathers.children[j];
			var lambertBlack = new THREE.MeshLambertMaterial({ color: colorValue, side: THREE.DoubleSide });
			feather.material = lambertBlack;

		}									
    });
	
	
	var f2 = gui.addFolder('Feather Size');
	
	
	f2.add(config, 'scale_x', 0.1, 10).onChange( function(scaleX)
    {
		for (var i in all_feathers.children) {

			var feathers = all_feathers.children[i];

			for(var j in feathers.children) {
				var feather = feathers.children[j];
				feather.scale.x = scaleX;
			}			

		}							
    });
	
	f2.add(config, 'scale_y', 0.1, 10).onChange( function(scaleY)
    {

		for (var i in all_feathers.children) {

			var feathers = all_feathers.children[i];

			for(var j in feathers.children) {
				var feather = feathers.children[j];
				feather.scale.y = scaleY;
			}			

		}

    });
	
	f2.add(config, 'scale_z', 0.1, 10).onChange( function(scaleZ)
    {
		for (var i in all_feathers.children) {

			var feathers = all_feathers.children[i];

			for(var j in feathers.children) {
				var feather = feathers.children[j];
				feather.scale.z = scaleZ;
			}			

		}								
    });
	
	
	var f3 = gui.addFolder('Feather Orientation');
	
	f3.add(config, 'rotate_x', 0, 360).onChange( function(rotateX){});
	
	f3.add(config, 'rotate_y', 0, 360).onChange( function(rotateY){});
	
	f3.add(config, 'rotate_z', 0, 360).onChange( function(rotateZ){});
	
	
	var f4 = gui.addFolder('Flapping Configuration');
	
	f4.add(config, 'flapping_speed', 1, 10).onChange( function(speed){});
	f4.add(config, 'flapping_motion', 1, 10).onChange( function(motion){});
	
	var f5 = gui.addFolder('Feather Distribution');
	
	f5.add(config, 'distribution').min(1).max(10).step(1);	
	
}

function getRandom() {
	return (Math.random()) / 50;
}

function updateFeatherPostions() {
	
	
	if (!mainFeatherCurve || !mainFeatherGeometry)
		return;
	
	var start = 1;
	var middle = Math.sin(frame/50 * config.flapping_speed)/2 * config.flapping_motion;
	middle = middle;
	var end = Math.sin(frame/50 * config.flapping_speed); 
	end = end ; 
	var s  = smoothstep(middle, end);
	//middle *= s;
	var s2  = smootherstep(start, middle);
	start *= s2;
	
	mainFeatherCurve = new THREE.CubicBezierCurve3(
		new THREE.Vector3( 0 , 0, 0 ),
		new THREE.Vector3( 1 + config.curvature, start, 0 + config.curvature ), 
		new THREE.Vector3( 1.5 + config.curvature, middle, -1  - config.curvature),
		new THREE.Vector3( 2.5 + config.curvature, end, -0.9 + config.curvature) 
	);
	
	var tempNum = mainFeatherGeometry.vertices.length;
	mainFeatherGeometry.vertices = mainFeatherCurve.getPoints(24 * config.distribution);
	var numMiddleFeathers = mainFeatherGeometry.vertices.length/1.2;
	var numSmallFeathers = mainFeatherGeometry.vertices.length/2;
	
	
	/*if (mainFeatherGeometry.vertices.length > tempNum) {
		
		if (scene)
		{		
			for( var i = scene.children.length - 1; i >= 0; i--) { 
				 var obj = scene.children[i];
				 scene.remove(obj);
			}
			
			all_feathers = new THREE.Object3D();
			main_feathers = new THREE.Object3D();
			middle_feathers = new THREE.Object3D();
			small_feathers = new THREE.Object3D();
			
			var lambertWhite = new THREE.MeshLambertMaterial({ color: 0x8e8e8e, side: THREE.DoubleSide, emissive: 0x0 });

			var lambertGray = new THREE.MeshLambertMaterial({ color: 0x555555, side: THREE.DoubleSide });

			var lambertBlack = new THREE.MeshLambertMaterial({ color: 0x393939, side: THREE.DoubleSide  });
			
			for (var i = 0; i < mainFeatherGeometry.vertices.length; i++) {

				var featherMesh = new THREE.Mesh(featherGeo, lambertBlack);
				featherMesh.name = "mainFeather";
				main_feathers.add(featherMesh);
				var j = mainFeatherGeometry.vertices.length-i-1;
				var p = mainFeatherGeometry.vertices[i];
				featherMesh.position.set(p.x,p.y,p.z);
				featherMesh.rotation.z = p.y;
				featherMesh.rotation.y = -(Math.PI/2) + lerp(0, Math.PI/2, i/mainFeatherGeometry.vertices.length);
				var scale = 0.5;
				featherMesh.scale.set(scale,scale,scale);
			}

			var numMiddleFeathers = mainFeatherGeometry.vertices.length/1.2;

			for (var i = 0; i < numMiddleFeathers; i++) {

				var featherMesh = new THREE.Mesh(featherGeo, lambertGray);
				featherMesh.name = "middleFeather";
				middle_feathers.add(featherMesh);
				var j = mainFeatherGeometry.vertices.length-i-1;
				var p = mainFeatherGeometry.vertices[i];	

				featherMesh.position.set(p.x,p.y+0.02,p.z);
				featherMesh.rotation.z = p.y;// * 1.3;
				featherMesh.rotation.y = -(Math.PI/2) + lerp(0, Math.PI/1.9, i/numMiddleFeathers);
				var scale = 0.3;
				featherMesh.scale.set(scale,scale,scale*2);

			}

			var numSmallFeathers = mainFeatherGeometry.vertices.length/2;


			for (var i = 0; i < numSmallFeathers; i++) {

				var featherMesh = new THREE.Mesh(featherGeo, lambertWhite);
				featherMesh.name = "smallFeather";
				small_feathers.add(featherMesh);
				var j = mainFeatherGeometry.vertices.length-i-1;
				var p = mainFeatherGeometry.vertices[i];

				featherMesh.position.set(p.x,p.y+0.04,p.z+0.05);
				featherMesh.rotation.z = p.y;// * 3;
				featherMesh.rotation.y = -(Math.PI/2) + lerp(0, Math.PI/1.8, i/numSmallFeathers);
				var scale = 0.2;
				featherMesh.scale.set(scale,scale,scale*3);

			}

			all_feathers.add(main_feathers);
			all_feathers.add(middle_feathers);
			all_feathers.add(small_feathers);
			scene.add(all_feathers);
		}
	
	} else {*/
		
		for (var i in all_feathers.children) {

			var feathers = all_feathers.children[i];

			for(var j in feathers.children) {
				var feather = feathers.children[j];

				var p = mainFeatherGeometry.vertices[j];

				if (!p)
					continue;

				feather.position.set(p.x,p.y,p.z);		

				if (i == 1) {
					p.y += 0.02;
				}
				else if (i == 2) {
					p.y += 0.04;
				}	

				feather.rotation.x = config.rotate_x * (Math.PI/180.0) + getRandom() * config.wind_x;

				feather.rotation.y = -(Math.PI/2) + lerp(0, Math.PI/2, j/mainFeatherGeometry.vertices.length) + config.rotate_y * (Math.PI/180.0) + getRandom() * config.wind_y;

				feather.rotation.z = p.y + config.rotate_z * (Math.PI/180.0)
				+ getRandom() * config.wind_z;

			}			

		}
		
	//}

}

function lerp(a, b, t) {
    return a * (1.0 - t) + b * t;
}

function smoothstep(edge0, edge1, x)
{
    x = Number.prototype.clamp((x - edge0)/(edge1 - edge0), 0.0, 1.0); 
    return x*x*(3 - 2*x);
}

function smootherstep(edge0, edge1, x)
{
    x = Number.prototype.clamp((x - edge0)/(edge1 - edge0), 0.0, 1.0); 
    return x*x*x*(x*(x*6 - 15)+10);
}

function Noise(x, y) 
{
    var n = x + y * 57
    var n = (n<<13) ^ n;
    return ( 1.0 - ( (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);   	
}

var frame = 0;
// called on frame updates
function onUpdate(framework) {

        var date = new Date();
		updateFeatherPostions();	
		frame++;
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);