//import { Raycaster, Vector2 } from "./lib/three.min.js";
//import Objects3DCollection from "./Objects3DCollection.js";

//TODO
//handler for hold, double tap, right hold 
//options: {raycastOnMove:boolean, layer: Number}
class RaycastManager extends Objects3DCollection {
    constructor(container, camera, options = {}) {

        super();

        this.raycastOnMouseMove = options.raycastOnMouseMove ? options.raycastOnMouseMove : false;

        this.layer = options.layer ? options.layer : 1;

        this.container = container;
        this.camera = camera;

        this.isPointerIn = false;

        this.pointer = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.intersects = [];
        this.raycaster.layers.set(this.layer);
        this.hoveredObject = null;
        this.pointerDownEvent = null;

        //const
        this.clickDelay = 500; //max time between pointer down and up (ms)
        this.clickDistance = 20; //max distance (pixel) between pointer down and up
        this.maxDoubleClickDelay = 500; //max time between 2 click events (ms)
        this.requestCheckHold = null;
        this.minHoldDelay = 500; //ms

        window.addEventListener("resize", this.onResize);
        this.boundingRect = this.container.getBoundingClientRect();
        this.enable();
    }


    /***********************************************************************************
    INTERNAL LOGIC	
    ************************************************************************************/
    performRaycast() {
        if (!this.isPointerIn)
            return null;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        this.intersects.length = 0;
        this.raycaster.intersectObjects(this.getObjectsAsArray(), false, this.intersects);

        let result;
        switch (this.intersects.length) {
            case 0:
                result = null;
                break;
            case 1:
                result = this.intersects[0];
                break;
            default:
                result = this.intersects[0];
                for (let i = 0; i < this.intersects.length; i++)
                    if (this.intersects[i].distance < result.distance)
                        result = this.intersects[i];
                break;
        }

        return result;
    }

    setPointerCoordinates(e) {
        this.isPointerIn = true;
        const rect = this.boundingRect;
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    dispose() {
        this.disable();
    }


    /***********************************************************************************
    EVENTS
    ************************************************************************************/
    onPointerDown = function(e) {
        this.pointerDownEvent = e;
        this.startCheckingHold();
    }.bind(this);

    onPointerUp = function(e) {      
        this.cancelHold();
        if (!this.pointerDownEvent || this.pointerDownEvent.pointerId !== e.pointerId) return;

        const delta = e.timeStamp - this.pointerDownEvent.timeStamp;

        if (delta < this.clickDelay)
            if (Math.abs(e.clientX - this.pointerDownEvent.clientX) < this.clickDistance &&
                Math.abs(e.clientY - this.pointerDownEvent.clientY) < this.clickDistance)
                this.onClick(e);
    }.bind(this);

    onClick = function(e) {
        
        const elapsed = e.timeStamp - (this.lastestClick ? this.lastestClick.timeStamp : 0);
        this.lastestClick = e;

        if (elapsed > this.maxDoubleClickDelay) {
            //raycast
            this.setPointerCoordinates(e);
            const result = this.performRaycast();           
            if (result && result.object.userData.onClick)
                result.object.userData.onClick({ object: result.object, point: result.point });

            //clean up
            this.pointerDownEvent = null;
        }
    }.bind(this)

    onPointerMove = function(e) {

        this.setPointerCoordinates(e);
        this.cancelHold();


        if (this.raycastOnMouseMove) {
            //raycast
            const result = this.performRaycast();
            //process result
            if (!result) {
                if (this.hoveredObject) {
                    if (this.hoveredObject.userData.onMouseLeave)
                        this.hoveredObject.userData.onMouseLeave({ object: this.hoveredObject });
                    this.hoveredObject = null;
                }
            } else {
                if (!this.hoveredObject) { //new object
                    this.hoveredObject = result.object;
                    if (this.hoveredObject.userData.onMouseEnter)
                        this.hoveredObject.userData.onMouseEnter({ object: this.hoveredObject, point: result.point });
                } else if (result.object == this.hoveredObject) { //same object
                    if (this.hoveredObject.userData.onMouseHover)
                        this.hoveredObject.userData.onMouseHover({ object: this.hoveredObject, point: result.point });
                } else { //replace old object
                    if (this.hoveredObject.userData.onMouseLeave)
                        this.hoveredObject.userData.onMouseLeave({ object: this.hoveredObject });
                    this.hoveredObject = result.object;
                    if (this.hoveredObject.userData.onMouseEnter)
                        this.hoveredObject.userData.onMouseEnter({ object: this.hoveredObject, point: result.point });
                }
            }
        }
    }.bind(this)

    onResize = function(e) {
        this.boundingRect = this.container.getBoundingClientRect();
    }.bind(this)


    startCheckingHold(e) {
        this.requestCheckHold = window.requestAnimationFrame(this.checkHold);
    }


    //check for pointer hold
    checkHold = function(timeStamp) {
        if (!this.pointerDownEvent)
            return;
        const delta = timeStamp - this.pointerDownEvent.timeStamp;
        if (delta >= this.minHoldDelay) {
            this.onClick(this.pointerDownEvent);
            this.cancelHold();
        } else
            this.requestCheckHold = window.requestAnimationFrame(this.checkHold)

    }.bind(this);

    cancelHold() {
        if (this.requestCheckHold)
            window.cancelAnimationFrame(this.requestCheckHold);
        this.requestCheckHold = null;
    }

    onPointerCancel = function(e) {
        this.cancelHold();
        if (this.hoveredObject)
            if (this.hoveredObject.userData.onMouseLeave)
                this.hoveredObject.userData.onMouseLeave({ object: this.hoveredObject });
        this.hoveredObject = null;
        this.pointerDownEvent = null;
    }.bind(this)

    onPointerOut = function(e) {
        /*
        this.cancelHold();
        this.isPointerIn = false;
        if (this.hoveredObject)
            if (this.hoveredObject.userData.onMouseLeave)
                this.hoveredObject.userData.onMouseLeave({ object: this.hoveredObject });
        this.hoveredObject = null;
        this.pointerDownEvent = null;
        */
    }.bind(this)


    /***********************************************************************************
    GETTERS/SETTERS
    ************************************************************************************/
    addObjects(objects, handlers) {
        for (let i = 0; i < objects.length; i++)
            this.addObject(objects[i], handlers);
    }
    addObject(object, handlers) {

        if (!this.objects[object.uuid]) {
            this.objects[object.uuid] = object;

            object.layers.enable(this.layer);

            const originalRaycast = object.raycast;

            object.raycast = function(raycaster, intersects) {
                //root object
                originalRaycast.apply(object, [raycaster, intersects]);
                if (intersects.length == 0) {
                    const innerIntersects = raycaster.intersectObjects(this.children);
                    if (innerIntersects.length > 0) {
                        innerIntersects[0].object = this;
                        intersects.push(innerIntersects[0]);
                    }
                }
            }
            if (handlers) {
                object.userData.onClick = handlers.onClick;
                object.userData.onMouseEnter = handlers.onMouseEnter;
                object.userData.onMouseLeave = handlers.onMouseLeave;
                object.userData.onMouseHover = handlers.onMouseHover;
            }
        }
    }


    enable() {
        this.container.addEventListener("pointermove", this.onPointerMove);
        this.container.addEventListener("pointerdown", this.onPointerDown);
        this.container.addEventListener("pointerup", this.onPointerUp);
        this.container.addEventListener("pointercancel", this.onPointerCancel);
        this.container.addEventListener("pointerout", this.onPointerOut);
    }

    disable() {
        this.container.removeEventListener("pointermove", this.onPointerMove);
        this.container.removeEventListener("pointerdown", this.onPointerDown);
        this.container.removeEventListener("pointerup", this.onPointerUp);
        this.container.removeEventListener("pointercancel", this.onPointerCancel);
        this.container.removeEventListener("pointerout", this.onPointerOut);
    }

    enableObject(object){
        object.layers.enable(this.layer);
    }
    disableObject(object){
        object.layers.disable(this.layer);
    }

    dispose() {
        this.disable();
    }
}

