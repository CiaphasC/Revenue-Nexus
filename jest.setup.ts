import "@testing-library/jest-dom"
import { TextDecoder, TextEncoder } from "util"

global.TextEncoder = TextEncoder as typeof global.TextEncoder
// @ts-ignore
if (!global.TextDecoder) {
  // @ts-ignore
  global.TextDecoder = TextDecoder
}
