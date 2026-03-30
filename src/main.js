import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// シーン・カメラ・レンダラーのセットアップ
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 5, 10)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

// コントロール（マウスでぐりぐり動かせる）
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// ライティング
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0)
directionalLight.position.set(5, 10, 5)
scene.add(directionalLight)

// GLTFLoaderでモデルを読み込む
const loader = new GLTFLoader()
loader.load(
  '/models/land.glb',       // publicフォルダからのパス
  (gltf) => {
    // 読み込み完了したらシーンに追加
    scene.add(gltf.scene)
  },
  (progress) => {
    // 読み込み中
    console.log('Loading...', (progress.loaded / progress.total * 100) + '%')
  },
  (error) => {
    // エラー
    console.error('Error:', error)
  }
)

// アニメーションループ
function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
animate()

// リサイズ対応
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})