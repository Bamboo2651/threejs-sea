import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
)
// カメラ位置はここを変えて調整してね
camera.position.set(0, 100, 10)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
// EXRをきれいに表示するために必要
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// 環境テクスチャの読み込み
const pmremGenerator = new THREE.PMREMGenerator(renderer)
pmremGenerator.compileEquirectangularShader()

const exrLoader = new EXRLoader()
exrLoader.load('/textures/sky.exr', (texture) => {
  const envMap = pmremGenerator.fromEquirectangular(texture).texture
  
  scene.background = envMap   // 背景として表示
  scene.environment = envMap  // モデルへの反射にも使う
  
  texture.dispose()
  pmremGenerator.dispose()
})

// ライティング
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
directionalLight.position.set(5, 10, 5)
scene.add(directionalLight)

// モデルの読み込み
const loader = new GLTFLoader()
loader.load(
  '/models/land.glb',
  (gltf) => {
    scene.add(gltf.scene)
  },
  (progress) => {
    console.log('Loading...', (progress.loaded / progress.total * 100) + '%')
  },
  (error) => {
    console.error('Error:', error)
  }
)

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})