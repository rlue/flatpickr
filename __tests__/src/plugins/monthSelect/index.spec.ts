import flatpickr from "index";
import monthSelectPlugin from "plugins/monthSelect/index";
import { German } from "l10n/de";
import { Instance } from "types/instance";
import { Options } from "types/options";

flatpickr.defaultConfig.animate = false;

jest.useFakeTimers();

const createInstance = (config?: Options): Instance => {
  return flatpickr(
    document.createElement("input"),
    config as Options
  ) as Instance;
};

describe("monthSelect", () => {
  it("should correctly preload defaultDate", () => {
    const fp = createInstance({
      defaultDate: new Date("2019-04-20"),
      plugins: [monthSelectPlugin({})],
    }) as Instance;

    expect(fp.input.value).toEqual("April 2019");
  });

  it("should correctly preload defaultDate with locale", () => {
    const fp = createInstance({
      defaultDate: new Date("2019-03-20"),
      locale: German,
      plugins: [monthSelectPlugin({})],
    }) as Instance;

    expect(fp.input.value).toEqual("März 2019");
  });

  it("should correctly preload defaultDate with format", () => {
    const fp = createInstance({
      defaultDate: new Date("2019-03-20"),
      locale: German,
      plugins: [monthSelectPlugin({ dateFormat: "m.y" })],
    }) as Instance;

    expect(fp.input.value).toEqual("03.19");
  });

  it("should correctly preload defaultDate and altInput with format", () => {
    const fp = createInstance({
      defaultDate: new Date("2019-03-20"),
      altInput: true,
      plugins: [monthSelectPlugin({ dateFormat: "m.y", altFormat: "m y" })],
    }) as Instance;

    expect(fp.input.value).toEqual("03.19");

    expect(fp.altInput).toBeDefined();
    if (!fp.altInput) return;

    expect(fp.altInput.value).toEqual("03 19");
  });

  describe("year nav", () => {
    describe("next/prev year buttons", () => {
      it("should increment/decrement year when clicked (#2275)", () => {
        const initYear = 2020;

        const fp = createInstance({
          plugins: [monthSelectPlugin()],
          defaultDate: new Date(`${initYear}-03-20`),
        }) as Instance;

        const prevButton = fp.monthNav.querySelector(".flatpickr-prev-month")!;
        prevButton.dispatchEvent(new MouseEvent("click"));

        expect(fp.currentYear).toEqual(initYear - 1);

        const nextButton = fp.monthNav.querySelector(".flatpickr-next-month")!;
        nextButton.dispatchEvent(new MouseEvent("click"));

        expect(fp.currentYear).toEqual(initYear);
      });

      it("should update displayed year when clicked (#2277)", () => {
        const initYear = new Date().getFullYear();

        const fp = createInstance({
          plugins: [monthSelectPlugin()],
        }) as Instance;

        const prevButton = fp.monthNav.querySelector(".flatpickr-prev-month")!;
        prevButton.dispatchEvent(new MouseEvent("click"));

        expect(fp.currentYearElement.value).toEqual(`${initYear - 1}`);

        const nextButton = fp.monthNav.querySelector(".flatpickr-next-month")!;
        nextButton.dispatchEvent(new MouseEvent("click"));
        nextButton.dispatchEvent(new MouseEvent("click"));

        expect(fp.currentYearElement.value).toEqual(`${initYear + 1}`);
      });

      it("should honor minDate / maxDate options (#2279)", () => {
        const lastYear = new Date().getFullYear() - 1;
        const nextYear = new Date().getFullYear() + 1;

        const fp = createInstance({
          plugins: [monthSelectPlugin()],
          minDate: `${lastYear}-03-20`,
          maxDate: `${nextYear}-03-20`,
        }) as Instance;

        const prevButton = fp.monthNav.querySelector(".flatpickr-prev-month")!;
        prevButton.dispatchEvent(new MouseEvent("click"));

        expect(prevButton.classList).toContain("flatpickr-disabled");

        const nextButton = fp.monthNav.querySelector(".flatpickr-next-month")!;
        nextButton.dispatchEvent(new MouseEvent("click"));
        nextButton.dispatchEvent(new MouseEvent("click"));

        expect(nextButton.classList).toContain("flatpickr-disabled");
      });

      describe("when in range mode, after abandoning input", () => {
        let fp: Instance;

        beforeEach(() => {
          const lastYear = new Date().getFullYear() - 1;

          fp = createInstance({
            mode: "range",
            plugins: [monthSelectPlugin()],
            minDate: `${lastYear}-03-20`,
          }) as Instance;

          fp.input.dispatchEvent(new MouseEvent("click")); // open flatpickr

          fp.rContainer!.querySelectorAll(
            ".flatpickr-monthSelect-month"
          )![1].dispatchEvent(new MouseEvent("click")); // pick start date

          document.dispatchEvent(new MouseEvent("click")); // abandon input
        });

        it("should still honor minDate options", () => {
          const prevButton = fp.monthNav.querySelector(
            ".flatpickr-prev-month"
          )!;
          prevButton.dispatchEvent(new MouseEvent("click"));

          expect(prevButton.classList).toContain("flatpickr-disabled");
        });
      });
    });
  });

  describe("month cell styling", () => {
    it("should apply .today to current month of current year", () => {
      const fp = createInstance({
        plugins: [monthSelectPlugin()],
      }) as Instance;

      const getTodayCell = (): Element | null | undefined =>
        fp.rContainer?.querySelector(".today");
      const currentMonth = fp.l10n.months.longhand[new Date().getMonth()];

      expect(getTodayCell()?.textContent).toEqual(currentMonth);

      const prevButton = fp.monthNav.querySelector(".flatpickr-prev-month")!;
      prevButton.dispatchEvent(new MouseEvent("click"));

      expect(getTodayCell()).toBeNull();

      const nextButton = fp.monthNav.querySelector(".flatpickr-next-month")!;
      nextButton.dispatchEvent(new MouseEvent("click"));

      expect(getTodayCell()?.textContent).toEqual(currentMonth);
    });

    it("should apply .selected to selected month of selected year", () => {
      const fp = createInstance({
        plugins: [monthSelectPlugin()],
      }) as Instance;

      const getSelectedCell = (): Element | null | undefined =>
        fp.rContainer?.querySelector(".selected");

      expect(getSelectedCell()).toBeNull();

      const selectionTarget = fp.rContainer!.querySelector(
        ".flatpickr-monthSelect-month:nth-child(6)"
      )!;
      selectionTarget.dispatchEvent(new MouseEvent("click"));

      expect(getSelectedCell()?.textContent).toEqual("June");

      const prevButton = fp.monthNav.querySelector(".flatpickr-prev-month")!;
      prevButton.dispatchEvent(new MouseEvent("click"));

      expect(getSelectedCell()).toBeNull();

      const nextButton = fp.monthNav.querySelector(".flatpickr-next-month")!;
      nextButton.dispatchEvent(new MouseEvent("click"));

      expect(getSelectedCell()?.textContent).toEqual("June");
    });
  });

  describe("range mode", () => {
    let fp: Instance;

    function selectableMonths(): NodeListOf<Element> {
      return fp.rContainer!.querySelectorAll(".flatpickr-monthSelect-month")!;
    }

    describe("after first selection/click", () => {
      beforeEach(() => {
        fp = createInstance({
          mode: "range",
          plugins: [monthSelectPlugin()],
        });

        fp.input.dispatchEvent(new MouseEvent("click")); // open flatpickr
        selectableMonths()[1].dispatchEvent(new MouseEvent("click"));
      });

      it("keeps calendar open until second selection/click", () => {
        expect(fp.calendarContainer.classList).toContain("open");

        selectableMonths()[5].dispatchEvent(new MouseEvent("click"));
        expect(fp.calendarContainer.classList).not.toContain("open");
      });

      describe("when hovering over other another month cell", () => {
        beforeEach(() => {
          selectableMonths()[5].dispatchEvent(
            new MouseEvent("mouseover", { bubbles: true })
          );
        });

        it("highlights all cells in the tentative range", () => {
          expect(selectableMonths()[1].classList).toContain("startRange");

          Array.from(selectableMonths())
            .slice(2, 5)
            .forEach((cell) => {
              expect(cell.classList).toContain("inRange");
            });

          expect(selectableMonths()[5].classList).toContain("endRange");
        });

        describe("and then prematurely abandoning input", () => {
          describe("by clicking out", () => {
            beforeEach(() => {
              document.dispatchEvent(new MouseEvent("click")); // close flatpickr
            });

            it("clears the highlighting", () => {
              selectableMonths().forEach((cell) => {
                expect(cell.classList).not.toContain("startRange");
                expect(cell.classList).not.toContain("inRange");
                expect(cell.classList).not.toContain("endRange");
              });
            });
          });

          describe("by alt-tabbing out and back in", () => {
            beforeEach(() => {
              window.document.dispatchEvent(new FocusEvent("blur"));
              window.document.dispatchEvent(new FocusEvent("focus"));
            });

            it("clears the highlighting", () => {
              selectableMonths().forEach((cell) => {
                expect(cell.classList).not.toContain("startRange");
                expect(cell.classList).not.toContain("inRange");
                expect(cell.classList).not.toContain("endRange");
              });
            });
          });
        });
      });

      describe("when hovering over another month cell in a different year", () => {
        beforeEach(() => {
          const nextButton = fp.monthNav.querySelector(
            ".flatpickr-next-month"
          )!;
          nextButton.dispatchEvent(new MouseEvent("click"));

          selectableMonths()[5].dispatchEvent(
            new MouseEvent("mouseover", { bubbles: true })
          );
        });

        it("highlights all visible cells in the tentative range", () => {
          Array.from(selectableMonths())
            .slice(0, 5)
            .forEach((cell) => {
              expect(cell.classList).toContain("inRange");
            });

          expect(selectableMonths()[5].classList).toContain("endRange");
        });
      });
    });

    describe("after two clicks (completed range selection)", () => {
      beforeEach(() => {
        fp = createInstance({
          mode: "range",
          plugins: [monthSelectPlugin()],
        });

        fp.input.dispatchEvent(new MouseEvent("click")); // open flatpickr
        selectableMonths()[1].dispatchEvent(new MouseEvent("click"));
        selectableMonths()[5].dispatchEvent(new MouseEvent("click"));
      });

      describe("when clicking again to start over", () => {
        beforeEach(() => {
          fp.input.dispatchEvent(new MouseEvent("click")); // reopen flatpickr

          selectableMonths()[3].dispatchEvent(new MouseEvent("click"));
          selectableMonths()[3].dispatchEvent(
            new MouseEvent("mouseover", { bubbles: true })
          ); // class changes seem to be triggered by hover, not click...
        });

        it("clears the highlighting", () => {
          expect(selectableMonths()[3].classList).toContain("startRange");

          [
            ...Array.from(selectableMonths()).slice(0, 3),
            ...Array.from(selectableMonths()).slice(4),
          ].forEach((cell) => {
            expect(cell.classList).not.toContain("startRange");
            expect(cell.classList).not.toContain("inRange");
            expect(cell.classList).not.toContain("endRange");
          });
        });
      });
    });
  });
});
