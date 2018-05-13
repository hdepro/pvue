const TEXT_NODE = 3;
const ATTR_NODE = 2;
const ELE_NODE = 1;

const TEXT_REG = /\{\{(.*)\}\}/;

function Vue(options) {
    const {el, data} = options;
    const elNode = document.querySelector(el);
    this.data = data;
    observe(data, this.data);
    parseNode(elNode, this.data);
}

function parseNode (node, vm) {
    let {childNodes, attributes} = node;
    let {length} = childNodes;
    for (let i=0;i<length;i++){
        let child = childNodes[i];
        switch (child.nodeType) {
            case TEXT_NODE:{
                const nodeValue = child.nodeValue;
                if (TEXT_REG.test(nodeValue)) {
                    const key = RegExp.$1.trim();
                    child.nodeValue = vm[key];
                    const watcher = new Watcher(child, vm, key);
                }
                break;
            }
            case ELE_NODE:
                parseNode(child, vm);
            default:
                break;
       }
    }
    length = attributes.length;
    for (let i=0;i<length;i++){
        let attr = attributes[i];
        const {nodeName, nodeValue} = attr;
        const names = nodeName.split(":");
        const command = names[0];
        const name = names[1];
        if (command === "v-bind") {
            let attrNode = document.createAttribute(name);
            attrNode.nodeValue = vm[nodeValue];
            node.setAttributeNode(attrNode);
            node.removeAttribute(nodeName);
            const watcher = new Watcher(attrNode, vm, nodeValue);
        }
        if (command === 'v-model') {
            node.addEventListener("input", function(e){
                vm[nodeValue] = e.target.value;
            });
            node.removeAttribute(nodeName);
        }
    }
}

function defineReactive (obj , key, val){
    const dep = new Dep();
    Object.defineProperty(obj, key, {
        get() {
            if(Dep.target) dep.add(Dep.target);
            return val;
        },
        set(newVal) {
            if(newVal === val) return;
            val = newVal;
            dep.notifyAll();
        }
    })
}

function observe (obj, vm) {
    Object.keys(obj).forEach(key => defineReactive(vm, key, obj[key]));
}

class Dep {
    constructor () {
        this.subs = [];
    }
    add (watcher) {
        this.subs.push(watcher);
    }
    remove (watcher) {
        const index = this.subs.findIndex(watcher);
        this.subs.splice(index, 1);
    }
    notifyAll () {
        console.log(this.subs);
        this.subs.forEach(sub => sub.update());
    }
}

class Watcher {
    constructor (node, vm, key) {
        this.node = node;
        this.vm = vm;
        this.key = key;
        Dep.target = this;
        this.get();
        Dep.target = null;
    }
    get () {
        this.value = this.vm[this.key];
    }
    update () {
        this.node.nodeValue = this.vm[this.key];
    }
}