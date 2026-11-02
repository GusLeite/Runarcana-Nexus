import { useEffect, useRef, useState } from 'react'
import { useCoverFocus } from './useCoverFocus.js'

const VERTEX = `
attribute vec2 pos;
varying vec2 v;
void main() {
  v = vec2(pos.x * 0.5 + 0.5, 0.5 - pos.y * 0.5);
  gl_Position = vec4(pos, 0.0, 1.0);
}
`
// Cerca de 30 quadros/s: o movimento é lento, e a cena aparece ao mesmo tempo no cartão e no destaque.
const FRAME_MS = 30

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader))
  return shader
}

function setup(gl, fragment) {
  const program = gl.createProgram()
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program))
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(program, 'pos')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
  return gl.getUniformLocation(program, 't')
}

// Imagem animada em tempo real por um shader (clip: src, width, height, scene, focus). Sem WebGL, fica a imagem parada.
export default function LivingArt({ clip }) {
  const ref = useRef()
  const [failed, setFailed] = useState(false)
  const pos = useCoverFocus(ref, clip)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let gl = null
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    } catch {
      gl = null
    }
    if (!gl) {
      setFailed(true)
      return
    }
    let uTime
    try {
      uTime = setup(gl, clip.scene)
    } catch (error) {
      console.error('Cena da origem não compilou:', error)
      setFailed(true)
      return
    }

    let frame = 0
    let last = 0
    let visible = true
    let ready = false
    const draw = now => {
      gl.uniform1f(uTime, (now / 1000) % 3600)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const still = reducedMotion()
    const loop = now => {
      frame = requestAnimationFrame(loop)
      if (now - last < FRAME_MS) return
      last = now
      draw(now)
    }
    // Só anima com a imagem pronta e o painel na tela.
    const sync = () => {
      cancelAnimationFrame(frame)
      if (ready && visible && !document.hidden && !still) frame = requestAnimationFrame(loop)
    }

    const image = new Image()
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
      ready = true
      draw(0)
      sync()
    }
    image.onerror = () => setFailed(true)
    image.src = clip.src

    const watch = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    watch.observe(canvas)
    document.addEventListener('visibilitychange', sync)
    const onLost = () => setFailed(true)
    canvas.addEventListener('webglcontextlost', onLost)
    return () => {
      cancelAnimationFrame(frame)
      image.onload = null
      image.onerror = null
      watch.disconnect()
      document.removeEventListener('visibilitychange', sync)
      canvas.removeEventListener('webglcontextlost', onLost)
      // O navegador limita os contextos WebGL abertos: libera este ao sair.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [clip])

  if (failed) return <img className="oart-img oart-clip" src={clip.src} alt="" style={{ objectPosition: (clip.focus ?? 0.5) * 100 + '% 50%' }} />
  return <canvas className="oart-img oart-clip" width={clip.width} height={clip.height} ref={ref} style={{ objectPosition: pos }} />
}
