const placegroundSceneModule = () => {
	const modelFile = 'tree.glb'
	const startingScale = new THREE.Vector3(0.0001, 0.0001, 0.0001)
	const endingScale = new THREE.Vector3(0.002, 0.002, 0.002)
	const animationMillis = 600
	const raycaster = new THREE.Raycaster()
	const tapPosition = new THREE.Vector2()
	const loader = new THREE.GLTFLoader()
	let surface
	
	const initXrScene = ({scene, camera}) => {
		console.log('initXrScene')
		surface = new THREE.Mesh(
			new THREE.PlaneGeometry(100, 100, 1, 1),
			new THREE.MeshBasicMaterial({
				color: 0xffff00,
				transparent: true,
				opacity: 0.0,
				side: THREE.DoubleSide
			})
		)
		surface.rotateX(-Math.PI / 2)
		surface.position.set(0, 0, 0)
		scene.add(surface)
		scene.add(new THREE.AmbientLight(0x404040, 5))
		camera.position.set(0, 3, 0)
	}

	const animateIn = (model, pointX, pointZ, yDegrees) => {
		console.log(`animateIn: ${pointX}, ${pointZ}, ${yDegrees}`)
		const scale = Object.assign({}, startingScale)

		model.scene.rotation.set(0.0, yDegrees, 0.0)
		model.scene.position.set(pointX, 0.0, pointZ)
		model.scene.scale.set(scale.x, scale.y, scale.z)
		XR8.Threejs.xrScene().scene.add(model.scene)
		new TWEEN.Tween(scale)
			.to(endingScale, animationMillis)
			.easing(TWEEN.Easing.Elastic.Out)
			.onUpdate(() => {model.scene.scale.set(scale.x, scale.y, scale.z)})
			.start()
	}

	const placeObject = (pointX, pointZ) => {
		console.log(`placing at ${pointX}, ${pointZ}`)
		loader.load(
			modelFile,
			(gltf) => {animateIn(gltf, pointX, pointZ, Math.random() * 360)}, 
			(xhr) => {console.log(`${(xhr.loaded / xhr.total * 100 )}% loaded`)},
			(error) => {console.log('An error happened')}
		)
	}

	const placeObjectTouchHandler = (e) => {
		console.log('placeObjectTouchHandler')
		if (e.touches.length == 2) {
			XR8.XrController.recenter()
		}
		if (e.touches.length > 2) {
			return
		}

		const {scene, camera} = XR8.Threejs.xrScene()
		tapPosition.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1
		tapPosition.y = - (e.touches[0].clientY / window.innerHeight) * 2 + 1
		raycaster.setFromCamera(tapPosition, camera)
		const intersects = raycaster.intersectObject(surface)
		if (intersects.length == 1 && intersects[0].object == surface) {
			placeObject(intersects[0].point.x, intersects[0].point.z)
		}
	}

	return {
		name: 'web-ar-slam-3',
		onStart: ({canvas, canvasWidth, canvasHeight}) => {
			const {scene, camera} = XR8.Threejs.xrScene()
			initXrScene({scene, camera})
			canvas.addEventListener('touchstart', placeObjectTouchHandler, true)
			animate()
			function animate(time) {
				requestAnimationFrame(animate)
				TWEEN.update(time)
			}
			XR8.XrController.updateCameraProjectionMatrix({
				origin: camera.position,
				facing: camera.quaternion
			})
		},
	}
}
const onxrloaded = () => {
	XR8.addCameraPipelineModules([
		XR8.GlTextureRenderer.pipelineModule(),
		XR8.Threejs.pipelineModule(),
		XR8.XrController.pipelineModule(), 
		XRExtras.AlmostThere.pipelineModule(), 
		XRExtras.FullWindowCanvas.pipelineModule(),
		XRExtras.Loading.pipelineModule(), 
		XRExtras.RuntimeError.pipelineModule(),
		placegroundSceneModule(),
	])
	XR8.run({canvas: document.getElementById('camerafeed')})
}

const load = () => {XRExtras.Loading.showLoading({onxrloaded})}
window.onload = () => {window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load)}