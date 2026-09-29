import type { RefObject } from 'react'

import { Stage } from './Stage'
import { VolumeScan } from './VolumeScan'
import { OncologyScene } from './scenes/OncologyScene'
import { VideoRagScene } from './scenes/VideoRagScene'

export function ProjectStage({
  scene,
  progress,
  visible,
}: {
  scene: 'video' | 'volume' | 'oncology'
  progress: RefObject<number>
  visible: boolean
}) {
  if (scene === 'volume') {
    return <VolumeScan progress={progress} visible={visible} colorA="#a8f0ff" colorB="#5fe3c4" spin={1.15} />
  }

  if (scene === 'oncology') {
    return (
      <Stage cameraPosition={[0, 0, 3.55]} fov={40} visible={visible}>
        <OncologyScene progress={progress} />
      </Stage>
    )
  }

  return (
    <Stage cameraPosition={[0, 0.15, 3.95]} fov={40} visible={visible}>
      <VideoRagScene progress={progress} />
    </Stage>
  )
}
