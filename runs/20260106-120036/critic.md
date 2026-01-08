# Stress Test Outputs

**A) 30s Reel Script**
*   **Visual:** Quick cuts between a frustrated person (Coachee) at a messy desk and a calm, listening Coach.
*   **Text Overlay (0-5s):** "Stuck? Telling them what to do doesn't work."
*   **Coach (Voiceover, 5-15s):** "So, what's the *specific* goal? What have you tried? What's one small option you haven't tested?"
*   **Visual:** Coachee's face lights up with an idea. They scribble a plan.
*   **Text Overlay (15-25s):** "Coaching. Unlock their potential. It's their goal, their answer, their action."
*   **Final Frame (25-30s):** Logo. Tagline: "GROW Your Team's Performance."
*   **Stuck Point:** The script leans heavily on the inferred "success signal" of a moment of clarity/action. The extraction lacks specific, vivid language for the *feeling* of a coaching breakthrough to make the reel emotionally compelling.

**B) One-Page Business Fable Outline**
*   **Title:** The Gardener and the Oak
*   **Characters:** Arden (anxious new manager, the Coachee), Sage (experienced leader, the Coach), Team (wilting plants).
*   **Plot:**
    1.  **Problem:** Arden's team is underperforming. He tries *telling* them what to do (micro-managing, instructing). Performance worsens.
    2.  **Encounter:** Sage observes and asks, "What's your one goal for this team?" (Establish Goal). Arden says "Better results." Sage pushes for specificity.
    3.  **Exploration:** Sage asks, "What's happening now? What's blocking them?" (Explore Reality). Arden realizes he hasn't listened to their ideas.
    4.  **Ideation:** "So, what could you do differently *tomorrow*?" (Generate Options). Arden brainstorms: ask for their input, delegate one task.
    5.  **Commitment:** "Which will you commit to?" (Will). Arden commits to holding a listening session.
    6.  **Result:** Arden acts. The team responds. He learns he doesn't need to have all the answers, just the right questions.
*   **Moral:** True growth comes from drawing out the potential within, not from imposing solutions from without.
*   **Stuck Point:** The fable needs a clear "Failure Mode" antagonist. The extraction lists dependency and vagueness as failures, but personifying them (e.g., "The Imp of Vagueness") feels forced without more source material on typical coachee resistance patterns.

**C) 6-Panel Comic Beat Sheet**
1.  **Panel 1:** Coachee looking overwhelmed, thought bubble: "My project is a mess. I need help!"
2.  **Panel 2:** Coach enters, not with a checklist, but with a question mark above head. Dialogue: "What's the one thing you want to change?"
3.  **Panel 3:** Split panel. Left: Coachee gives a vague answer ("Make it better"). Right: Coach asks, "Be specific."
4.  **Panel 4:** Coach asking questions ("What's working?" "What's the block?"). Coachee thinking, connecting dots.
5.  **Panel 5:** Coachee excited, lightbulb moment. Dialogue: "I could try X! Or maybe Y!"
6.  **Panel 6:** Coachee walking away determined, checking watch. Dialogue: "First step, today at 3 PM." Coach smiling in background.
*   **Stuck Point:** The comic sequence assumes the "Generate Options" step flows naturally from exploration. The extraction doesn't provide techniques for when a coachee is stuck ideating, making the middle panels potentially simplistic.

# Faithfulness Audit

*   **Anchor Verification Issues:** All cited anchors are present and verbatim in the source files.
*   **Unsupported [EXTRACTED] Claims:** None. All [EXTRACTED] claims have valid anchors.
*   **Overreach / Bad [INFERRED]:**
    *   **Process Non-Linearity:** The inference that the process is not strictly linear is **well-supported** by two strong anchors: "framework" (not a rigid sequence) and the dynamic nature of the conversation.
    *   **Success Signals:** The inference that success includes "gains clarity" or "takes sustained, self-directed action" is a **reasonable extension** of the stated purpose (achieve goals, improve performance). However, "sustained" is an add-on.
    *   **Failure Fix for "Lack of Action":** The fix ("scale back the action") is a **reasonable inference** but is not anchored. The source only commits to the step "commit to action," not troubleshooting it.
    *   **Teaching Strategy - Contrast with Therapy:** The inferred contrast "Performance/Goal Focus vs. Therapy/Past Focus" is **NOT anchored** in the provided sources. This is external lore/common knowledge being introduced.
*   **Mislabeling:** None.

# Scorecard

| Category | Score (0-5) | Rationale |
| :--- | :--- | :--- |
| **Operational Completeness** | 3 | Core roles, purpose, and the 4-step GROW process are captured. Lacks explicit **decision rules** and detailed **success/failure signals**. |
| **Decision Rules Clarity** | 0 | Field is marked "[NOT IN SOURCE]". No rules for guiding the coach's moment-to-moment choices are provided. |
| **Teaching Transfer** | 4 | The model clearly distinguishes coaching from instruction, outlines the GROW framework, and provides a Do/Don't list. Effective for basic understanding. |
| **Generator Readiness** | 3 | Provides solid core elements for generation (purpose, roles, process steps). Missing nuance on handling process breakdowns and lacks "key phrases" for authentic dialogue generation. |
| **Faithfulness** | 4 | Nearly all claims are well-anchored. One minor overreach (therapy contrast) and one inferred fix without direct anchor. Overall, highly faithful to the provided text. |
| **Non-Plagiarism Safety** | 5 | Excellent use of anchoring. All direct concepts are cited. The extraction paraphrases and structures ideas without copying long, uncredited passages. |

# Fix Spec

*   **MUST ADD:**
    *   **Decision Rules:** Add a field for **Decision Rules**, even if it must be populated with `[NOT EXPLICIT IN SOURCE]`. This highlights a major gap in the operational logic extracted from the source.
    *   **Key Phrases:** Complete the **Key Phrases** section. The prompt cuts off. This is critical for dialogue generation and faithful tone replication.

*   **MUST DOWNGRADE:**
    *   In **Author Delivery Model > Framing Contrasts**, change "Performance/Goal Focus vs. Therapy/Past Focus" from `[NOT IN SOURCE]` to `[INFERRED - EXTERNAL LORE]` or, preferably, **REMOVE** it entirely, as it is not supported by the given chapters.

*   **MUST PROVIDE ANCHORS:**
    *   For the **Failure Fix for "Lack of Action"**, the inference is logical but unanchored. Either find an anchor in the source text about overcoming barriers or scaling actions, or change the `[INFERRED]` tag to `[LOGICAL EXTENSION]` to clearly signal it's not sourced.

*   **MUST REWRITE:**
    *   The **Success Signals** inference "takes sustained, self-directed action" should be rephrased to more closely align with the anchors. E.g., "...takes action toward their goal" or "demonstrates improved performance or progress toward a goal."

*   **OPTIONAL:**
    *   To increase generator readiness, one could infer and add a "**Common Variations**" or "**Context Notes**" field, noting that the model is presented as universal but may be applied in business/personal contexts per the foreword and preamble.