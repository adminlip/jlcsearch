import { expect, test } from "bun:test"
import { headerTableSpec } from "lib/db/derivedtables/header"

const makeComponent = (overrides: Record<string, unknown> = {}) =>
  ({
    lcsc: 123,
    mfr: "TEST-HEADER",
    description: "",
    stock: 100,
    basic: 0,
    preferred: 0,
    price: JSON.stringify([{ qFrom: 1, qTo: null, price: 0.1 }]),
    package: "TH",
    extra: JSON.stringify({
      attributes: {
        Pitch: "2.54mm",
        "Number of Pins": "16P",
        "Mounting Type": "Straight",
      },
    }),
    source_subcategory: "Pin Headers",
    ...overrides,
  }) as any

test("header table maps Pin Headers to male when description is blank", () => {
  const [header] = headerTableSpec.mapToTable([makeComponent()])

  expect(header?.gender).toBe("male")
})

test("header table maps Female Headers to female when description is blank", () => {
  const [header] = headerTableSpec.mapToTable([
    makeComponent({ source_subcategory: "Female Headers" }),
  ])

  expect(header?.gender).toBe("female")
})

test("header table treats bend-insert headers as right angle", () => {
  const [header] = headerTableSpec.mapToTable([
    makeComponent({
      extra: JSON.stringify({
        attributes: {
          Pitch: "2.54mm",
          "Number of Pins": "16P",
          "Mounting Type": "Bend insert",
        },
      }),
    }),
  ])

  expect(header?.is_right_angle).toBe(true)
})
