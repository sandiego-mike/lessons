import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../materials/liam-learning-app');
const jsonPath = resolve(root, 'data/course-data.json');
const inlinePath = resolve(root, 'data-inline.js');
const data = JSON.parse(readFileSync(jsonPath, 'utf8'));

const standard = (id, shortDescription) => ({
  id,
  authority: 'California Common Core State Standards for Mathematics - Math I',
  shortDescription,
  sourceUrl: 'https://www2.cde.ca.gov/cacs/math'
});

const additions = {
  1: [
    ['Properties of Real Numbers', 'reasoning', 'Classify numbers and use the commutative, associative, distributive, identity, and inverse properties to rewrite expressions efficiently. Mental-math goal: recognize structure before calculating.', 'Name the property that justifies 7(20 - 3) = 140 - 21, then evaluate mentally.', 'Distributive property; 121.', standard('N-RN.B.3', 'Use properties of rational and irrational numbers.')],
    ['Descriptive Modeling with Expressions', 'model', 'Translate quantities, units, constraints, and relationships from a real situation into an expression. State what each number and variable represents before simplifying.', 'A streaming plan costs $12 plus $3 per movie. Write an expression for m movies and explain each term.', '12 + 3m; 12 is the fixed fee and 3m is the movie cost.', standard('N-Q.A.2', 'Define appropriate quantities for descriptive modeling.')]
  ],
  3: [
    ['Representing Relations', 'model', 'Represent the same relation as ordered pairs, a mapping, a table, and a graph. Check whether each input has exactly one output.', 'Represent {(1,3),(2,5),(3,7)} in a table and state whether it is a function.', 'The table has x-values 1,2,3 and y-values 3,5,7; it is a function.', standard('F-IF.A.1', 'Understand a function as assigning exactly one output to each input.')],
    ['Linearity and Continuity of Graphs', 'graph', 'Decide whether a graph is linear or nonlinear and discrete or continuous. Use constant rate of change for linearity and the real-world domain to decide whether values between points make sense.', 'A tank fills 4 gallons each minute. Is the graph linear and continuous? Explain.', 'Yes. The rate is constant and fractional times are meaningful.', standard('F-IF.B.4', 'Interpret key features of functions in context.')],
    ['Intercepts and Shapes of Graphs', 'graph', 'Find x- and y-intercepts and describe increasing, decreasing, constant, maximum, minimum, and symmetry. Connect every visual feature to its meaning in context.', 'For y = 2x - 6, find both intercepts and explain what an intercept means.', 'y-intercept (0,-6); x-intercept (3,0). Each marks where the graph crosses an axis.', standard('F-IF.B.4', 'Interpret intercepts and other key graph features.')],
    ['Sketching and Comparing Functions', 'graph', 'Compare functions given by equations, tables, graphs, or verbal rules. Identify rate of change, initial value, domain, range, and key features before deciding which changes faster.', 'Function A is y=3x+2. Function B has values (0,5),(1,7),(2,9). Which grows faster?', 'Function A grows faster because its rate is 3 versus 2.', standard('F-IF.C.9', 'Compare properties of two functions represented in different ways.')],
    ['Piecewise and Step Functions', 'graph', 'Read one rule at a time and apply it only on its stated interval. Mark included endpoints with closed circles and excluded endpoints with open circles.', 'Evaluate f(x)={x+2 if x<3; 10 if x>=3} at x=2 and x=3.', 'f(2)=4 and f(3)=10.', standard('F-IF.C.7b', 'Graph piecewise-defined functions, including step functions.')],
    ['Absolute Value Functions', 'graph', 'View y=|x| as distance from zero. For y=a|x-h|+k, locate the vertex (h,k), determine opening and width from a, and use symmetry to graph quickly.', 'State the vertex and opening of y=-2|x-3|+1.', 'Vertex (3,1); it opens downward.', standard('F-IF.C.7b', 'Graph absolute value functions and show key features.')]
  ],
  4: [
    ['Linear Regression', 'data', 'Use technology or a line of fit to model bivariate data. Interpret slope and intercept in context, then use residuals and correlation to judge whether the model is useful without claiming causation.', 'A regression line is y=1.8x+42 for study time x and score y. Interpret the slope.', 'Each additional hour studied is associated with about 1.8 more score points.', standard('S-ID.B.6', 'Represent bivariate data and fit a function to the data.')],
    ['Inverses of Linear Functions', 'model', 'An inverse reverses a function. Swap input and output, solve for the new output, and verify by composition. Restrict the domain when needed so each input has one output.', 'Find the inverse of f(x)=3x-6.', 'f^-1(x)=(x+6)/3.', standard('F-BF.B.4', 'Find inverse functions in simple cases.')]
  ],
  6: [
    ['Transformations of Exponential Functions', 'graph', 'Start with y=b^x. Horizontal shifts occur inside the exponent, vertical shifts occur outside, and a negative multiplier reflects the graph. Track the asymptote as well as growth or decay.', 'Describe y=2^(x-3)+4 from y=2^x.', 'Shift right 3 and up 4; horizontal asymptote y=4.', standard('F-BF.B.3', 'Identify effects of transformations on function graphs.')],
    ['Writing Exponential Functions', 'model', 'Use y=a(b)^x: a is the initial value and b is the repeated growth or decay factor. Convert a percent rate r to 1+r for growth or 1-r for decay.', 'Write a function for $500 growing 6% per year.', 'y=500(1.06)^t.', standard('F-LE.A.2', 'Construct exponential functions from a description or two input-output pairs.')]
  ],
  7: [
    ['Summarizing Categorical Data', 'data', 'Use two-way frequency and relative-frequency tables to compare categories. Compare conditional percentages, not raw totals, when group sizes differ.', 'In a group, 18 of 30 ninth graders and 24 of 50 tenth graders prefer online homework. Which grade has the larger proportion?', 'Ninth grade: 60% versus 48%.', standard('S-ID.B.5', 'Summarize categorical data in two-way frequency tables.')]
  ],
  8: [
    ['Two- and Three-Dimensional Figures', 'model', 'Classify figures using defining properties, sketch cross sections, and connect nets to solids. Distinguish perimeter, area, surface area, and volume by their units.', 'A plane cuts a rectangular prism parallel to its base. What is the cross section?', 'A rectangle congruent to the base.', standard('G-GMD.B.4', 'Identify shapes of two-dimensional cross sections of three-dimensional objects.')],
    ['Precision and Accuracy', 'reasoning', 'Accuracy describes closeness to the true value; precision describes repeatability or measurement detail. Report units and round only after completing the calculation.', 'Measurements are 10.21, 10.22, and 10.21 cm, but the true length is 10.80 cm. Are they precise, accurate, both, or neither?', 'Precise but not accurate.', standard('N-Q.A.3', 'Choose an appropriate level of accuracy for reported quantities.')]
  ],
  9: [
    ['Conjectures and Counterexamples', 'reasoning', 'Use patterns to form a conjecture, but disprove a universal claim with one valid counterexample. Examples can support a conjecture; they do not prove it.', 'Disprove: all prime numbers are odd.', 'The number 2 is prime and even.', standard('G-CO.C.9', 'Prove theorems about lines and angles using valid reasoning.')],
    ['Conditionals and Biconditionals', 'reasoning', 'Separate a statement into hypothesis and conclusion. Write its converse, inverse, and contrapositive, and use a biconditional only when both the statement and converse are true.', 'Write the contrapositive of: If a figure is a square, then it has four sides.', 'If a figure does not have four sides, then it is not a square.', standard('G-CO.C.9', 'Use precise logical statements in geometric arguments.')]
  ],
  11: [
    ['Compositions of Transformations', 'graph', 'Apply transformations in the stated order and track each vertex. A composition of rigid motions preserves lengths and angle measures.', 'Translate (2,-1) by <3,4>, then reflect it across the y-axis.', 'After translation: (5,3); after reflection: (-5,3).', standard('G-CO.A.5', 'Given a figure and a transformation, draw the transformed figure and specify a sequence.')],
    ['Symmetry', 'graph', 'A line of symmetry maps a figure onto itself by reflection. Rotational symmetry maps it onto itself by a turn less than 360 degrees. Identify the smallest angle of rotation.', 'What rotational symmetry does a non-square rectangle have?', 'It maps onto itself after 180 degrees.', standard('G-CO.A.3', 'Describe rotations and reflections that carry a figure onto itself.')]
  ],
  12: [
    ['Proving Right Triangles Congruent', 'reasoning', 'Use the Hypotenuse-Leg theorem only for right triangles: prove both are right triangles, identify congruent hypotenuses, and identify one pair of congruent legs.', 'Two right triangles have congruent hypotenuses and one congruent leg. Which theorem proves congruence?', 'HL congruence.', standard('G-SRT.B.5', 'Use congruence criteria to solve problems and prove relationships in geometric figures.')],
    ['Proving the Slope Criteria', 'reasoning', 'Use equal slopes to prove nonvertical lines parallel and negative-reciprocal slopes to prove nonvertical lines perpendicular. Handle vertical and horizontal lines as a special perpendicular pair.', 'Lines have slopes 2/3 and -3/2. What can you prove?', 'They are perpendicular because the slopes are negative reciprocals.', standard('G-GPE.B.5', 'Prove slope criteria for parallel and perpendicular lines.')],
    ['Constructing Inscribed Polygons', 'model', 'Construct regular polygons in circles by dividing the central angle of 360 degrees into equal parts, then connecting consecutive points on the circle.', 'What central angle is used to construct a regular hexagon in a circle?', '360/6 = 60 degrees.', standard('G-C.A.3', 'Construct inscribed and circumscribed circles and regular polygons.')]
  ]
};

const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
for (const chapter of data.math.chapters) {
  const extra = additions[chapter.number] || [];
  const existing = new Set(chapter.sections.map(section => section.title));
  let suffix = 1;
  for (const [title, kind, lesson, prompt, answer, alignedStandard] of extra) {
    if (existing.has(title)) continue;
    const conceptId = slug(title);
    chapter.sections.push({
      number: `${chapter.number}.R${suffix++}`,
      title,
      blocks: [lesson, `Fast method: identify the structure first, do only the necessary arithmetic, and check the result against the graph, units, or original condition.`, `Reveal Math Integrated I alignment: explain the decision, use an appropriate representation, and interpret the result.`],
      pages: [],
      math: {
        kind,
        terms: title.toLowerCase().split(/\s+/).filter(word => word.length > 4).slice(0, 5),
        activity: { type: kind, prompt, answer, conceptId },
        standard: alignedStandard
      }
    });
    chapter.knowledgeCheck.push({
      type: kind,
      prompt,
      guidance: 'Solve efficiently, show the essential decision, and check the result.',
      answer,
      conceptId,
      objectiveId: `math-${chapter.number}-reveal-${conceptId}`
    });
  }
}

data.math.scopeAlignment = {
  source: 'California Reveal Math Integrated I Scope and Sequence (2025)',
  units: 13,
  status: 'lesson-level aligned',
  note: 'Reveal-only lessons are integrated into the related source-textbook chapters so Liam keeps one coherent course path.'
};

const serialized = JSON.stringify(data);
writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
writeFileSync(inlinePath, `window.__LIAM_COURSE_DATA__=${serialized};\n`);
