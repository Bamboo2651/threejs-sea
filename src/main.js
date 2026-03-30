import * as THREE from 'three/webgpu'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { WaterMesh } from 'three/examples/jsm/objects/WaterMesh.js'
import { SkyMesh } from 'three/examples/jsm/objects/SkyMesh.js'

// ① シーン・カメラ・レンダラー
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
)
camera.position.set(0, 30, 100)

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.5
document.body.appendChild(renderer.domElement)

// ② コントロール
const controls = new OrbitControls(camera, renderer.domElement)
controls.maxPolarAngle = Math.PI * 0.495
controls.minDistance = 10
controls.maxDistance = 500
controls.update()

// ③ 太陽の位置
const sun = new THREE.Vector3()

// ④ 空
const sky = new SkyMesh()
sky.scale.setScalar(10000)
scene.add(sky)

sky.turbidity.value = 10
sky.rayleigh.value = 2
sky.mieCoefficient.value = 0.001
sky.mieDirectionalG.value = 0.8

// ⑤ 海面
const waterGeometry = new THREE.PlaneGeometry(10000, 10000)
const waterNormals = new THREE.TextureLoader().load('/textures/waternormals.jpg')
waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping

const water = new WaterMesh(waterGeometry, {
    waterNormals: waterNormals,
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
})
water.rotation.x = -Math.PI / 2
scene.add(water)

// ⑥ 太陽の位置を更新する関数
const pmremGenerator = new THREE.PMREMGenerator(renderer)
const sceneEnv = new THREE.Scene()
let renderTarget

function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - 10)
    const theta = THREE.MathUtils.degToRad(180)

    sun.setFromSphericalCoords(1, phi, theta)

    sky.sunPosition.value.copy(sun)
    water.sunDirection.value.copy(sun).normalize()

    if (renderTarget !== undefined) renderTarget.dispose()

    sceneEnv.add(sky)
    renderTarget = pmremGenerator.fromScene(sceneEnv)
    scene.add(sky)

    scene.environment = renderTarget.texture
}

// ⑦ 陸モデルの読み込み
// const loader = new GLTFLoader()
// loader.load(
//     '/models/land.glb',
//     (gltf) => {
//         scene.add(gltf.scene)
//     },
//     (progress) => {
//         console.log('Loading...', (progress.loaded / progress.total * 100) + '%')
//     },
//     (error) => {
//         console.error('Error:', error)
//     }
// )

// ⑧ WebGPU初期化後にupdateSunを呼ぶ
renderer.init().then(updateSun)

// ⑨ アニメーションループ
function render() {
    controls.update()
    renderer.render(scene, camera)
}
renderer.setAnimationLoop(render)

// ⑩ リサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})