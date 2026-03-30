# Three.js WebGPU 海のシーン まとめ

## 全体の構成

```
scene（シーン）
├── SkyMesh（空）
├── WaterMesh（海面）
└── GLTFLoader（陸モデル）※現在コメントアウト中
```

---

## 使用技術

| 技術 | 役割 |
|------|------|
| `three/webgpu` | WebGPUベースのThree.js |
| `WaterMesh` | リアルな海面を作るアドオン |
| `SkyMesh` | リアルな空を作るアドオン |
| `OrbitControls` | マウスでカメラを動かす |
| `GLTFLoader` | BlenderのGLBモデルを読み込む |
| `PMREMGenerator` | 環境マップを生成する |

---

## コードの流れ

### ① シーン・カメラ・レンダラー

```javascript
import * as THREE from 'three/webgpu' // WebGPU版のThree.js

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(55, width / height, 1, 20000)
camera.position.set(0, 30, 100)

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.5
```

**ポイント**
- `three/webgpu` にするだけで内部がWebGPUで動く
- `ACESFilmicToneMapping` は映画的な色調補正。自然な明暗になる
- `toneMappingExposure` で全体の明るさを調整（1.0が基準）

---

### ② 空（SkyMesh）

```javascript
const sky = new SkyMesh()
sky.scale.setScalar(10000) // 巨大なドームにする

sky.turbidity.value = 10       // 大気の濁り（低いほど澄んだ青空）
sky.rayleigh.value = 2         // 青みの強さ
sky.mieCoefficient.value = 0.001 // 霞の量
sky.mieDirectionalG.value = 0.8  // 太陽周りの光の広がり
```

**数値の目安**

| パラメータ | 低い | 高い |
|-----------|------|------|
| turbidity | 澄んだ青空 | 霞がかった空 |
| rayleigh | 白っぽい | 深い青 |
| mieCoefficient | クリア | 霞あり |

---

### ③ 海面（WaterMesh）

```javascript
const waterGeometry = new THREE.PlaneGeometry(10000, 10000)
const waterNormals = new THREE.TextureLoader().load('/textures/waternormals.jpg')
waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping

const water = new WaterMesh(waterGeometry, {
  waterNormals: waterNormals, // 波の凹凸を表現する法線マップ
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x001e0f,   // 水の色
  distortionScale: 3.7,   // 波の歪みの大きさ
})
water.rotation.x = -Math.PI / 2 // 平面を水平に回転
```

**ポイント**
- `waternormals.jpg` が波のリアルな揺れを作っている
- `RepeatWrapping` でテクスチャをタイリングする
- `distortionScale` を大きくすると波が荒くなる

---

### ④ 太陽の位置（updateSun）

```javascript
const sun = new THREE.Vector3()

function updateSun() {
  const phi = THREE.MathUtils.degToRad(90 - 10) // 仰角（elevation）
  const theta = THREE.MathUtils.degToRad(180)    // 方位角（azimuth）

  sun.setFromSphericalCoords(1, phi, theta) // 球面座標→3Dベクトルに変換

  sky.sunPosition.value.copy(sun)           // 空の太陽位置を更新
  water.sunDirection.value.copy(sun).normalize() // 海への反射を更新

  sceneEnv.add(sky)
  renderTarget = pmremGenerator.fromScene(sceneEnv)
  scene.environment = renderTarget.texture  // 環境マップを更新
}
```

**仰角（elevation）の目安**

| 値 | 見た目 |
|----|--------|
| 90 | 真上（昼） |
| 10 | 低い太陽（夕方っぽい） |
| 0 | 地平線 |
| -10〜-20 | 夜 |

**なぜ空と海を同じsunベクトルで同期するのか**
```
sky.sunPosition  → 空に太陽を描く
water.sunDirection → 海面に太陽を反射させる
→ 同じベクトルを使うことで自然に見える
```

---

### ⑤ WebGPU初期化とアニメーションループ

```javascript
// WebGPUの初期化が終わってからupdateSunを呼ぶ（非同期）
renderer.init().then(updateSun)

function render() {
  controls.update()
  renderer.render(scene, camera)
}
renderer.setAnimationLoop(render) // requestAnimationFrameの代わり
```

**ポイント**
- `renderer.init()` はWebGPUの初期化。終わってからシーンを構築する必要がある
- `setAnimationLoop` は普通の `requestAnimationFrame` と同じ役割

---

## 普通のThree.jsとの違いまとめ

| 普通のThree.js | WebGPU版 |
|---------------|---------|
| `import from 'three'` | `import from 'three/webgpu'` |
| `WebGLRenderer` | `WebGPURenderer` |
| `requestAnimationFrame` | `renderer.setAnimationLoop` |
| `material.color = ...` | `material.color.value = ...` |
| 初期化不要 | `renderer.init().then(...)` が必要 |

---

## ファイル構成

```
project/
├── public/
│   ├── models/
│   │   └── land.glb
│   └── textures/
│       └── waternormals.jpg
└── src/
    └── main.js
```