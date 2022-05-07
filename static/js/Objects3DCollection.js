class Objects3DCollection {
    constructor() {
        this.objects = {};
    }

    setObjects(objects) {
        this.clearObjects();
        this.addObjects(objects);
    }

    addObject(object) {
        const uuid = object.uuid;
        this.objects[uuid] = object;
    }

    addObjects(objects) {
        for (let i = 0; i < objects.length; i++)
            this.addObject(objects[i]);
    }

    removeObject(object) {
        delete this.objects[object.uuid];
    }

    removeObjects(objects) {
        for (let i = 0; i < objects.length; i++)
            this.removeObject(object[i]);
    }

    clearObjects() {
        this.objects = {};
    }

    getObjectsAsArray() {
        return Object.values(this.objects)
    }

    getObjectById(uuid) {
        return this.objects[uuid];
    }

}
