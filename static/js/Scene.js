
class Scene extends THREE.EventDispatcher {
    constructor(container, cameraName) {

        super();

        this.container = container;
        this.boundingRect = this.container.getBoundingClientRect();

        this.defaultCamera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.01, 1000);
        this.defaultCamera.position.set(0, 3, 10);
        this.camera = this.defaultCamera;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);

        //raycast manager
        this.raycastManager = new RaycastManager(this.container, this.camera, { raycastOnMouseMove: true });

        this.setupScene(cameraName);

        //start render
        this.startAnimationLoop();

    }

    onResize = function () {
        //TODO : max dimension pour écrans 4k
        this.boundingRect = this.container.getBoundingClientRect();
        this.updateCameraAspect();
        this.renderer.setSize(this.boundingRect.width, this.boundingRect.height)
    }.bind(this)

    dispose() {
        this.stopAnimationLoop();
    }

    setupScene(cameraName) {

        this.scene = new THREE.Scene();
        this.currentCamera = this.camera;

        this.setupLights();

        this.loader = new THREE.GLTFLoader();
        this.loader.load(
            "/res/models/terrain.glb",
            (model) => {
                this.scene.add(model.scene);
            });
        this.loader.load(
            "/res/models/objects.glb",
            (model) => {
                this.model = model.scene;
                this.scene.add(model.scene);
                this.changeCamera(cameraName);

                for (let object of model.scene.children)
                    if (object.isMesh)
                        this.raycastManager.addObject(object, {
                            onClick: () => { this.requestNavigation(object.name) }
                        });
            },
            function (progress) {
            },
            function (error) {
                console.log("error load gltf", error);
            }
        );

    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xaaaaaa); // soft white light
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(0, 0.1, 1)
        this.scene.add(directionalLight);
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight2.position.set(0, -0.1, -1)
        this.scene.add(directionalLight2);
    }

    /*********************************************************************************************************
    INTERNALS
    *********************************************************************************************************/
    requestNavigation = function (name) {
        this.dispatchEvent({ type: 'navigate', name });
    }

    setHoveredElement(name) {
        const object = this.scene.getObjectByName(name);
    }
    unsetHoveredElement(name) {
        const object = this.scene.getObjectByName(name);
    }

    navigateTo(params) {
    }

    changeCamera(name) {

        if (!name)
            name = "welcome";//default cam

        const cameraName = name + "_cm";
        const newCamera = this.scene.getObjectByName(cameraName);
        this.camera = newCamera.children[0];

        this.updateCameraAspect();
        this.raycastManager.camera = this.camera;
    }

    updateCameraAspect() {
        this.camera.aspect = this.boundingRect.width / this.boundingRect.height;
        this.camera.updateProjectionMatrix();
    }



    /*********************************************************************************************************
    ANIMATION LOOP
    *********************************************************************************************************/
    update = function (delta) {
        this.renderer.render(this.scene, this.camera);
        // this.controls.update(delta);
    }.bind(this)

    startAnimationLoop() {
        this.renderer.setAnimationLoop(this.update);
    }
    stopAnimationLoop() {
        this.renderer.setAnimationLoop(null);
    }
}

