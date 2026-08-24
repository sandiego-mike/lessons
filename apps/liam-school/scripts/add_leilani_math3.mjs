import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const app = resolve(import.meta.dirname, '../materials/liam-learning-app');
const jsonPath = resolve(app, 'data/course-data.json');
const data = JSON.parse(readFileSync(jsonPath, 'utf8'));

const S = (id, shortDescription) => ({ id, authority: 'California Common Core State Standards for Mathematics - Integrated III', shortDescription, sourceUrl: 'https://www2.cde.ca.gov/cacs/math' });
const sections = (unit, rows) => rows.map((row, i) => {
  const [title, prompt, answer, kind='math-solve', standard=S('F-IF.B.4','Interpret key features of functions.')] = row;
  const conceptId=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const tryPrompt=prompt.length<25?`${prompt} Show the most efficient valid method.`:prompt;
  return {number:`${unit}.${i+1}`,title,blocks:[
    `Learn the structure behind ${title} before calculating. Identify the form, choose the shortest valid method, and predict what the answer should look like.`,
    `Fast approach: organize the given information, use algebraic structure or a graph to reduce the work, and keep exact values until the final step.`,
    `Verification matters: substitute, compare a graph, check units or domain restrictions, and explain what the result means.`
  ],pages:[],math:{kind,terms:title.toLowerCase().split(/\s+/).filter(x=>x.length>3).slice(0,5),activity:{type:kind,prompt:tryPrompt,answer,conceptId},standard}};
});

const vocab = {
  1:[['polynomial','An expression made from variables and nonnegative whole-number exponents.','3x^2-2x+7'],['leading coefficient','The coefficient of the highest-degree term.','In 4x^3-x, it is 4.'],['end behavior','How a function behaves as x moves far left or right.','An even-degree positive-leading polynomial rises on both ends.'],['binomial','A polynomial with exactly two terms.','x+5'],['degree','The greatest exponent in a polynomial.','The degree of 2x^4-x is 4.']],
  2:[['zero','An input where a function equals zero.','x=3 is a zero of (x-3)(x+1).'],['multiplicity','How many times a factor occurs.','(x-2)^3 has a zero of multiplicity 3.'],['factor theorem','x-a is a factor exactly when f(a)=0.','If f(4)=0, x-4 is a factor.'],['remainder theorem','Dividing f(x) by x-a leaves remainder f(a).','The remainder for x-2 is f(2).'],['polynomial identity','An equation true for all permitted values.','(a+b)^2=a^2+2ab+b^2.']],
  3:[['radical','An expression containing a root.','sqrt(x+4)'],['rational exponent','An exponent that represents a root and a power.','x^(1/2)=sqrt(x).'],['inverse function','A function that reverses another function.','If f(x)=2x+3, f^-1(x)=(x-3)/2.'],['composition','Using the output of one function as the input of another.','f(g(x))'],['domain restriction','A limit on allowable inputs.','x must be at least 0 for sqrt(x) over real numbers.']],
  4:[['exponential function','A function with the variable in the exponent.','y=3(1.05)^t'],['growth factor','The repeated multiplier greater than 1.','A 5% growth factor is 1.05.'],['decay factor','The repeated multiplier between 0 and 1.','A 12% decay factor is 0.88.'],['geometric series','A sum whose terms have a constant ratio.','2+6+18+54'],['asymptote','A line a graph approaches.','y=0 is an asymptote of 2^x.']],
  5:[['logarithm','The exponent needed to produce a number from a base.','log_2(8)=3.'],['common logarithm','A logarithm with base 10.','log(100)=2.'],['natural logarithm','A logarithm with base e.','ln(e^4)=4.'],['change of base','A formula for evaluating logs in another base.','log_b(x)=ln(x)/ln(b).'],['logarithmic property','A rule that rewrites products, quotients or powers.','log(ab)=log(a)+log(b).']],
  6:[['rational expression','A quotient of polynomials.','(x+1)/(x-3)'],['excluded value','A value that makes a denominator zero.','x cannot equal 3 in 1/(x-3).'],['reciprocal function','A function built from 1/x.','f(x)=1/x'],['vertical asymptote','A vertical line approached by a graph.','x=3 for 1/(x-3).'],['extraneous solution','A result introduced by algebra that fails the original equation.','Always check rational equations.']],
  7:[['population','The full group being studied.','All students in a district.'],['sample','A subset used to learn about a population.','A random selection of 200 students.'],['sampling distribution','The distribution of a statistic over repeated samples.','Repeated sample means.'],['normal distribution','A symmetric bell-shaped distribution.','Many measurement errors are approximately normal.'],['margin of error','A range expressing sampling uncertainty.','An estimate of 52% plus or minus 3%.']],
  8:[['cross section','Cross sections are two-dimensional slices of solids.','A plane through a cylinder can make a circle.'],['solid of revolution','Solids of revolution form by rotating plane figures.','Rotating a rectangle around an edge makes a cylinder.'],['density','Density measures mass contained in each unit of volume.','density=mass/volume'],['law of sines','Law of sines relates each side to the sine of its opposite angle.','a/sin A=b/sin B'],['law of cosines','Law of cosines relates three sides and one included angle.','c^2=a^2+b^2-2ab cos C.']],
  9:[['radian','An angle measure based on arc length and radius.','pi radians equals 180 degrees.'],['unit circle','A radius-one circle used to define trig functions.','A point is (cos theta,sin theta).'],['period','The horizontal length of one repeated cycle.','sin x has period 2pi.'],['amplitude','Half the vertical distance from minimum to maximum.','y=3sin x has amplitude 3.'],['phase shift','A horizontal translation of a periodic graph.','sin(x-pi/2) shifts right pi/2.']]
};

const units = [
  {title:'Polynomials and Polynomial Functions',semester:1,standard:S('A-APR.A.1','Perform arithmetic operations on polynomials.'),rows:[
    ['Operations with Polynomials','Simplify (3x^2-2x+5)+(x^2+7x-4).','4x^2+5x+1.'],
    ['Dividing Polynomials','Divide x^3-4x^2+x+6 by x-2.','x^2-2x-3 with remainder 0.'],
    ['Powers of Binomials','Expand (x-3)^3.','x^3-9x^2+27x-27.'],
    ['Polynomial Functions','For f(x)=2x^3-x+4, identify degree and leading coefficient.','Degree 3; leading coefficient 2.','reasoning'],
    ['Analyzing Graphs of Polynomial Functions','Predict the end behavior of f(x)=-2x^4+3x^2-1.','Both ends fall because the degree is even and the leading coefficient is negative.','graph']
  ]},
  {title:'Polynomial Equations',semester:1,standard:S('A-APR.B.3','Identify zeros of polynomials and use them to sketch graphs.'),rows:[
    ['Solving Polynomial Equations by Graphing','A graph crosses the x-axis at -2, 1 and 4. State the real zeros.','-2, 1 and 4.','graph'],
    ['Solving Polynomial Equations Algebraically','Solve x^3-4x=0.','x(x-2)(x+2)=0, so x=-2,0,2.'],
    ['Proving Polynomial Identities','Verify (x+y)^2-(x-y)^2=4xy.','Expansion gives 4xy on the left.','reasoning'],
    ['Remainder and Factor Theorems','Find the remainder when f(x)=x^3+2x-5 is divided by x-2.','f(2)=8+4-5=7.'],
    ['Roots and Zeros','Write a polynomial with zeros 3 and -2.','Any nonzero multiple of (x-3)(x+2); simplest x^2-x-6.']
  ]},
  {title:'Inverse and Radical Functions',semester:1,standard:S('N-RN.A.2','Rewrite expressions involving radicals and rational exponents.'),rows:[
    ['nth Roots and Rational Exponents','Rewrite 27^(2/3) and evaluate.','(cube root of 27)^2=9.'],
    ['Operations with Radical Expressions','Simplify sqrt(50)+2sqrt(8).','5sqrt(2)+4sqrt(2)=9sqrt(2).'],
    ['Solving Radical Equations and Inequalities','Solve sqrt(x+5)=x-1 and check.','x=4 works; other algebraic candidates must be rejected if they fail.'],
    ['Operations on Functions','If f(x)=x^2 and g(x)=x+3, find (f+g)(x) and f(g(x)).','x^2+x+3; (x+3)^2.'],
    ['Inverse Relations and Functions','Find the inverse of f(x)=3x-7.','f^-1(x)=(x+7)/3.']
  ]},
  {title:'Exponential Functions',semester:1,standard:S('F-LE.A.4','Use logarithms to solve exponential equations in context.'),rows:[
    ['Graphing Exponential Functions','For y=3(2)^x-4, state the y-intercept and horizontal asymptote.','y-intercept -1; asymptote y=-4.','graph'],
    ['Solving Exponential Equations and Inequalities','Solve 5^(x+1)=125.','125=5^3, so x+1=3 and x=2.'],
    ['Special Exponential Functions','Explain why e^x is useful in continuous growth.','Its rate of change is proportional to its current value.','reasoning'],
    ['Geometric Sequences and Series','Find the sum of the first 5 terms of 3,6,12,...','3(2^5-1)/(2-1)=93.'],
    ['Modeling Data','A population begins at 800 and decreases 7% yearly. Write the model.','P(t)=800(0.93)^t.','model']
  ]},
  {title:'Logarithmic Functions',semester:1,standard:S('F-BF.B.5','Understand inverse relationships between exponents and logarithms.'),rows:[
    ['Logarithms and Logarithmic Functions','Rewrite 2^5=32 in logarithmic form.','log base 2 of 32 equals 5.'],
    ['Properties of Logarithms','Expand log((x^3 sqrt(y))/z).','3log x + (1/2)log y - log z.'],
    ['Common Logarithms','Solve 10^x=750 using a common logarithm.','x=log(750), approximately 2.8751.'],
    ['Natural Logarithms','Solve e^(2x)=15.','x=ln(15)/2, approximately 1.354.'],
    ['Using Exponential and Logarithmic Functions','How long for $1000 to double at 6% continuous growth?','2000=1000e^(0.06t), so t=ln2/0.06, about 11.55 years.','model']
  ]},
  {title:'Rational Functions',semester:2,standard:S('A-APR.D.6','Rewrite rational expressions using polynomial division.'),rows:[
    ['Multiplying and Dividing Rational Expressions','Simplify ((x^2-9)/(x^2-x-6))*((x-3)/(x+3)).','(x-3)/(x-2), with original exclusions x not equal -2,3,-3 as applicable.'],
    ['Adding and Subtracting Rational Expressions','Simplify 2/x + 3/(x+1).','(5x+2)/(x(x+1)); x cannot equal 0 or -1.'],
    ['Graphing Reciprocal Functions','Describe y=1/(x-2)+3.','Shift right 2 and up 3; asymptotes x=2 and y=3.','graph'],
    ['Graphing Rational Functions','Find holes and vertical asymptotes of (x^2-1)/(x^2-3x+2).','Factor: (x-1)(x+1)/((x-1)(x-2)); hole at x=1, vertical asymptote x=2.','graph'],
    ['Solving Rational Equations and Inequalities','Solve 1/x + 1/(x+2)=3/4.','Multiply by 4x(x+2), solve, then reject excluded values; solutions x=2 and x=-4/3.']
  ]},
  {title:'Inferential Statistics',semester:2,standard:S('S-IC.B.6','Evaluate reports based on statistical data.'),rows:[
    ['Random Sampling and Studies','Which design best estimates student sleep: voluntary social-media poll or stratified random sample?','A stratified random sample is less vulnerable to voluntary-response bias.','data-analysis'],
    ['Using Statistics to Make Decisions','A 95% interval for a difference is entirely above zero. What does that support?','Evidence supports a positive population difference at the stated confidence level.','data-analysis'],
    ['Analyzing Population Data','Explain why correlation from an observational study does not prove causation.','Confounding variables and lack of random assignment prevent a causal conclusion.','reasoning'],
    ['Probability Distributions','For a fair die, find the expected value.','(1+2+3+4+5+6)/6=3.5.','data-analysis'],
    ['Normal Distributions','A value is one standard deviation above the mean. What is its z-score?','z=1.','data-analysis'],
    ['Estimating Population Parameters','Interpret 48% plus or minus 4%.','A plausible interval for the population proportion is 44% to 52%, under the study assumptions.','data-analysis']
  ]},
  {title:'Advanced Geometry',semester:2,standard:S('G-GMD.B.4','Identify cross sections and solids of revolution.'),rows:[
    ['Cross Sections and Solids of Revolution','Rotate y=3 from x=0 to x=5 around the x-axis. Describe the solid.','A cylinder with radius 3 and height 5.','model'],
    ['Density','A metal object has mass 540 g and volume 60 cm^3. Find density.','9 g/cm^3.'],
    ['Trigonometry and Area','Find the area of a triangle with sides 8 and 11 and included angle 40 degrees.','A=(1/2)(8)(11)sin40 degrees, about 28.28 square units.'],
    ['The Law of Sines','In a triangle, A=35 degrees, a=10 and B=72 degrees. Find b.','b=10 sin72/sin35, about 16.58.'],
    ['The Law of Cosines','Find the side opposite a 60-degree angle between sides 7 and 9.','c=sqrt(7^2+9^2-2(7)(9)cos60)=sqrt67, about 8.19.']
  ]},
  {title:'Trigonometric Functions',semester:2,standard:S('F-TF.B.5','Choose trigonometric functions to model periodic phenomena.'),rows:[
    ['Angles and Angle Measure','Convert 225 degrees to radians.','225(pi/180)=5pi/4.'],
    ['Trigonometric Functions of General Angles','Find sin, cos and tan for the unit-circle point (-sqrt(2)/2,sqrt(2)/2).','sin=sqrt(2)/2, cos=-sqrt(2)/2, tan=-1.'],
    ['Circular and Periodic Functions','A wheel completes one turn every 8 seconds. Find angular frequency.','2pi/8=pi/4 radians per second.'],
    ['Graphing Sine and Cosine Functions','State amplitude and period of y=4sin(3x).','Amplitude 4; period 2pi/3.','graph'],
    ['Graphing Other Trigonometric Functions','State the period and vertical asymptotes of y=tan x.','Period pi; asymptotes x=pi/2+kpi.','graph'],
    ['Translations of Trigonometric Graphs','Describe y=2cos(x-pi/3)+1.','Amplitude 2, right shift pi/3, up 1, period 2pi.','graph']
  ]}
];

const chapters=units.map((unit,i)=>{
  const number=i+1, chapterSections=sections(number,unit.rows), vocabulary=vocab[number].map(([term,definition,example])=>({term,definition,example,context:example}));
  const worksheet=chapterSections.slice(0,4).map(s=>({type:s.math.kind,prompt:s.math.activity.prompt,answer:s.math.activity.answer,conceptId:s.math.activity.conceptId}));
  const knowledgeCheck=chapterSections.map(s=>({type:s.math.kind,prompt:s.math.activity.prompt,guidance:'Show the essential method and verify the result.',answer:s.math.activity.answer,conceptId:s.math.activity.conceptId,objectiveId:`math3-${s.number}`}));
  return {number,title:unit.title,sections:chapterSections,reviewQuestions:chapterSections.map(s=>s.math.activity.prompt),worksheet,knowledgeCheck,standards:[unit.standard,S('N-Q.A.1','Use units and quantities to solve problems and interpret answers.')],vocabulary,cover:`assets/math3-${String(number).padStart(2,'0')}-visual.svg`,visual:`assets/math3-${String(number).padStart(2,'0')}-visual.svg`,semester:unit.semester};
});

const semester = n => {const cs=chapters.filter(c=>c.semester===n);return {chapters:cs.map(c=>c.number),review:cs.flatMap(c=>c.knowledgeCheck.slice(0,2).map(q=>({chapter:c.number,prompt:q.prompt,answer:q.answer}))),final:cs.flatMap(c=>c.knowledgeCheck.slice(0,2).map(q=>({chapter:c.number,prompt:q.prompt,answer:q.answer})))}};
data.math3={id:'math3',studentId:'leilani',name:'Integrated Math III',grade:11,description:'California Reveal Math Integrated III full-year course with SAT/ACT preparation.',scopeAlignment:{source:'California Reveal Math Integrated III Scope and Sequence (2025)',units:9,lessons:47,status:'lesson-level aligned'},chapters,missing:[],semesters:{1:semester(1),2:semester(2)}};

writeFileSync(jsonPath, `${JSON.stringify(data,null,2)}\n`);
writeFileSync(resolve(app,'data-inline.js'), `window.__LIAM_COURSE_DATA__=${JSON.stringify(data)};\n`);

mkdirSync(resolve(app,'assets'),{recursive:true});
for(const chapter of chapters){const n=String(chapter.number).padStart(2,'0'),title=chapter.title.replace(/&/g,'&amp;');writeFileSync(resolve(app,`assets/math3-${n}-visual.svg`),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-label="Integrated Math III ${title}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4c1d95"/><stop offset="1" stop-color="#0e7490"/></linearGradient></defs><rect width="800" height="500" rx="34" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-width="7" opacity=".82"><path d="M80 380 C170 80 270 450 390 160 S610 390 730 100"/><circle cx="195" cy="240" r="78"/><path d="M470 350 L570 165 L690 350 Z"/></g><text x="55" y="75" fill="#fff" font-family="Arial,sans-serif" font-size="30" font-weight="700">INTEGRATED MATH III · UNIT ${chapter.number}</text><text x="55" y="455" fill="#fff" font-family="Arial,sans-serif" font-size="36" font-weight="700">${title}</text></svg>`)}
