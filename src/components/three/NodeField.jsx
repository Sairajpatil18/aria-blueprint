import { Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const COUNT = 40
const CYAN = '#22d3ee'
const VIOLET = '#8b5cf6'

function Sphere({ position, color, size }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 24, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        roughness={0.3}
        metalness={0.1}
        transparent
        opacity={0.92}
      />
    </mesh>
  )
}

function Connection({ from, to, color }) {
  const geometry = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...from),
        new THREE.Vector3(...to),
      ]),
    [from, to],
  )

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.22} />
    </line>
  )
}

export default function NodeField() {
  const group = useRef()

  const nodes = useMemo(
    () =>
      Array.from({ length: COUNT }, () => {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const radius = 1.7 + Math.random() * 0.7
        return {
          position: [
            Math.sin(phi) * Math.cos(theta) * radius,
            Math.sin(phi) * Math.sin(theta) * radius * 0.7,
            Math.cos(phi) * radius,
          ],
          color: Math.random() > 0.5 ? CYAN : VIOLET,
          size: 0.05 + Math.random() * 0.08,
        }
      }),
    [],
  )

  const connections = useMemo(() => {
    const pairs = []
    for (let i = 0; i < nodes.length; i++) {
      const next = (i + 1) % nodes.length
      const from = nodes[i].position
      const to = nodes[next].position
      const distance = Math.hypot(
        to[0] - from[0],
        to[1] - from[1],
        to[2] - from[2],
      )
      if (distance < 2.3) {
        pairs.push({ key: `ring-${i}`, from, to, color: VIOLET })
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = nodes[Math.floor(Math.random() * nodes.length)].position
      const b = nodes[Math.floor(Math.random() * nodes.length)].position
      pairs.push({ key: `jump-${i}`, from: a, to: b, color: CYAN })
    }
    return pairs
  }, [nodes])

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.06
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.12
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.08
  })

  return (
    <group ref={group}>
      <ambientLight intensity={0.55} />
      <pointLight position={[4, 4, 5]} intensity={1.1} color={CYAN} />
      <pointLight position={[-5, -3, 3]} intensity={0.8} color={VIOLET} />
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.3}>
        {nodes.map((node, index) => (
          <Sphere
            key={index}
            position={node.position}
            color={node.color}
            size={node.size}
          />
        ))}
        {connections.map((line) => (
          <Connection
            key={line.key}
            from={line.from}
            to={line.to}
            color={line.color}
          />
        ))}
      </Float>
    </group>
  )
}
