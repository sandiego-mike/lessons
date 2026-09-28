(function(){
'use strict';
if(typeof S==='undefined'||typeof guideFor!=='function'||typeof worksheetItems!=='function'||typeof knowledgeItems!=='function')return;
const isCh7=()=>S.subject==='math'&&Number(S.chapter)===7;
const sourceSections=[
 {id:'7.1',title:'Measures of Center and Variation',url:'https://static.bigideasmath.com/protected/content/pe/hsim/int_math1_pe_07_01.pdf'},
 {id:'7.2',title:'Box-and-Whisker Plots',url:'https://static.bigideasmath.com/protected/content/pe/hsim/int_math1_pe_07_02.pdf'},
 {id:'7.3',title:'Shapes of Distributions',url:'https://static.bigideasmath.com/protected/content/pe/hsim/int_math1_pe_07_03.pdf'},
 {id:'7.4',title:'Two-Way Tables',url:'https://static.bigideasmath.com/protected/content/pe/hsim/int_math1_pe_07_04.pdf'},
 {id:'7.5',title:'Choosing a Data Display',url:'https://static.bigideasmath.com/protected/content/pe/hsim/int_math1_pe_07_05.pdf'}
];
const step=(t,learn,worked,tryPrompt,tryAnswer,apply,more)=>({t,learn,worked,try:tryPrompt,tryAnswer,apply,more});
const guide={steps:[
 step('7.1 · Center, outliers, and what “typical” means',
  'Learning objective: compare mean, median, and mode and decide which measure best represents a data set. An outlier can pull the mean strongly while changing the median much less. Always order data before finding the median.',
  'Worked example: For 3, 5, 5, 8, 14, mean = 35/5 = 7, median = 5, mode = 5. The high value 14 pulls the mean upward, so median may better describe a typical value.',
  'For 4, 6, 6, 8, 11, find the mean, median, and mode. Which measure would you use to describe a typical value, and why?',
  'Mean 7; median 6; mode 6. Median or mode can describe the cluster; explain the choice from the data.',
  'Explain what would happen to the mean and median if a very large outlier were added.',
  'Source objective: textbook §7.1 compares measures of center and examines the effect of outliers.'),
 step('7.1 · Range and standard deviation',
  'Learning objective: describe variation. Range uses only the greatest and least values. Standard deviation uses every value and measures typical distance from the mean. Small standard deviation means tightly clustered data; large standard deviation means greater spread.',
  'Worked method: find the mean; subtract it from each value; square each deviation; average the squared deviations (variance); take the square root. Interpretation must use the data units.',
  'For 40, 35, 45, 55, 60, find the range. Then explain what a larger standard deviation would mean for a second data set with the same mean.',
  'Range = 60 - 35 = 25. A larger standard deviation means the second set is more spread out around its mean.',
  'Why is standard deviation usually more informative about overall spread than range?',
  'Source objective: textbook §7.1 requires range, standard deviation, interpretation, and comparison.'),
 step('7.1 · Transforming data',
  'Learning objective: predict how adding or multiplying every data value changes center and variation. Adding k shifts mean, median, and mode by k but leaves range and standard deviation unchanged. Multiplying every value by positive k multiplies both center and variation measures by k.',
  'Worked example: If mean=20, median=18, range=12, SD=3 and every value increases by 5, the new mean=25, median=23, range=12, SD=3.',
  'A data set has mean 50, median 48, range 20, and standard deviation 4. Every value is multiplied by 1.5. Find the new four measures.',
  'Mean 75; median 72; range 30; standard deviation 6.',
  'Explain why adding the same number to every value does not change standard deviation.',
  'Source objective: textbook §7.1 explicitly teaches effects of data transformations.'),
 step('7.2 · Five-number summary and box plots',
  'Learning objective: construct a box-and-whisker plot from the five-number summary: minimum, Q1, median (Q2), Q3, maximum. Quartiles divide ordered data into four parts.',
  'Worked example: Order 8,8,9,9,10,11,11,15,16,16,19,20. Minimum=8, Q1=9, median=11, Q3=16, maximum=20. Plot those five landmarks on a number line.',
  'Find the five-number summary for 5, 7, 8, 9, 10, 12, 13, 15.',
  'Minimum 5; Q1 7.5; median 9.5; Q3 12.5; maximum 15.',
  'Describe how each of the five numbers controls part of a box-and-whisker plot.',
  'Source objective: textbook §7.2 requires constructing and interpreting box-and-whisker plots.'),
 step('7.2 · IQR, spread, and comparing box plots',
  'Learning objective: IQR = Q3 - Q1 and describes the spread of the middle 50%. Longer boxes or whiskers indicate more spread in that region. Compare center, spread, and shape—not just one number.',
  'Worked example: If Q1=220 and Q3=280, IQR=60. Half the observations lie between 220 and 280.',
  'A box plot has min 10, Q1 18, median 22, Q3 31, max 35. Find range and IQR. Where is the data more spread: below Q1 or above Q3?',
  'Range 25; IQR 13; below Q1 spans 8 while above Q3 spans 4, so the lower whisker is more spread.',
  'Explain why two data sets can have the same median but very different variability.',
  'Source objective: textbook §7.2 interprets range/IQR and compares distributions.'),
 step('7.3 · Shape of distributions',
  'Learning objective: recognize symmetric, skewed left, and skewed right distributions. The tail points toward the direction of skew. Shape helps determine which summary measures are appropriate.',
  'Worked rule: symmetric → mean + standard deviation are usually useful; skewed → median + five-number summary are more resistant to the tail/outliers.',
  'A histogram has most values between 50 and 70 with a long tail toward 20. Describe the shape and choose appropriate measures of center and variation.',
  'Skewed left; use median for center and the five-number summary/IQR for variation.',
  'Explain why the mean moves toward a long tail more than the median does.',
  'Source objective: textbook §7.3 connects distribution shape to appropriate measures.'),
 step('7.3 · Comparing distributions and unusual values',
  'Learning objective: compare distributions using shape, center, and spread together. For a roughly bell-shaped symmetric distribution, about 68% of values lie within 1 standard deviation of the mean and about 95% within 2.',
  'Worked example: mean=14, SD=4. The interval within 1 SD is 10 to 18; for a bell-shaped distribution about 68% of values are expected there.',
  'A bell-shaped data set has mean 70 and SD 3. Give the interval within 2 standard deviations and the approximate percent expected there.',
  '64 to 76; about 95%.',
  'When comparing two distributions, write one sentence about shape, one about center, and one about spread.',
  'Source objective: textbook §7.3 compares distributions and interprets standard deviation in context.'),
 step('7.4 · Two-way tables and marginal frequencies',
  'Learning objective: organize two categorical variables in a two-way table. Interior cells are joint frequencies; row/column totals are marginal frequencies. The grand total must agree by rows and columns.',
  'Worked example: Freshmen yes=55/no=22 and sophomores yes=63/no=12. Row totals are 77 and 75; column totals are 118 and 34; grand total=152.',
  'A survey has Grade 9 yes=36/no=24 and Grade 10 yes=42/no=18. Find all marginal frequencies and the grand total.',
  'Grade 9 total 60; Grade 10 total 60; Yes total 78; No total 42; grand total 120.',
  'Explain the difference between a joint frequency and a marginal frequency.',
  'Source objective: textbook §7.4 requires reading, making, and interpreting two-way tables.'),
 step('7.4 · Relative and conditional frequencies',
  'Learning objective: joint relative frequency divides a joint count by the grand total. Marginal relative frequency describes a row/column total as a fraction of the whole. Conditional relative frequency divides by the relevant row or column total—the denominator changes with the condition.',
  'Worked example: If 36 of 60 ninth graders answer yes, P(yes | ninth grade)=36/60=60%. If 36 of 120 total students are ninth graders who answer yes, the joint relative frequency is 30%.',
  'Using Grade 9 yes=36/no=24 and Grade 10 yes=42/no=18, find P(yes | Grade 10) and the joint relative frequency for Grade 10 & yes.',
  '42/60 = 70%; joint relative frequency = 42/120 = 35%.',
  'Explain why conditional and joint relative frequencies can be different even for the same cell.',
  'Source objective: textbook §7.4 requires joint, marginal, conditional relative frequencies and recognizing associations.'),
 step('7.4 · Association from conditional percentages',
  'Learning objective: compare conditional percentages to decide whether two categorical variables appear associated. Similar conditional percentages suggest weak/no association; large differences suggest an association in the sample. Association does not by itself prove causation.',
  'Worked example: If 67.5% of exercisers eat fruits/vegetables daily but only 13% of non-exercisers do, the sample shows a strong association.',
  'Group A has 72% success and Group B has 70% success. Does this show a strong association between group and success? Explain.',
  'Probably not; the conditional percentages are very similar (72% vs 70%).',
  'State what additional evidence would be needed before making a causal claim.',
  'Source objective: textbook §7.4 uses conditional relative frequencies to recognize associations.'),
 step('7.5 · Choose the right data display',
  'Learning objective: distinguish qualitative (categorical) from quantitative data and select a display that reveals the feature you need. Bar/circle graphs fit categories; histograms/stem-and-leaf/dot/box plots fit quantitative distributions; line graphs show change over time; scatterplots compare two quantitative variables.',
  'Worked example: Eye color is categorical, so a bar or circle graph is appropriate. Vehicle speeds are quantitative, so a histogram, dot plot, stem-and-leaf plot, or box plot can reveal distribution.',
  'Choose and justify a display for (a) favorite school subject and (b) test scores for two classes.',
  '(a) bar/circle graph for categories; (b) comparative box plots or histograms for quantitative distributions.',
  'For each choice, name what the display makes easy to see.',
  'Source objective: textbook §7.5 requires classifying data and choosing/creating appropriate displays.'),
 step('7.5 · Detect misleading graphs',
  'Learning objective: evaluate whether a graph communicates data fairly. Check title, labels, units, equal spacing, scale, zero/breaks, and consistent bar/section sizes.',
  'Worked example: A vertical axis beginning near the observed values can visually exaggerate a small change. The numbers may be correct while the visual impression is misleading.',
  'A sales graph runs from $99.5M to $104.5M instead of starting at zero and shows a rise from $100M to $103M. Explain how a viewer could be misled and how you would redraw it.',
  'The truncated scale exaggerates the visual size of the increase. Redraw with a clearly justified scale, preferably zero or an obvious axis break, and equal intervals.',
  'Write a four-item checklist Liam can use before trusting a statistical graph.',
  'Source objective: textbook §7.5 explicitly teaches analysis and correction of misleading graphs.'),
 {t:'Chapter 7 mastery · Connect all five sections',learn:'Show that you can choose the correct statistical tool, calculate accurately, interpret the result in context, and explain why the method fits.',try:'Complete each mastery question. Use calculations where needed and a sentence of interpretation.',questions:[
  'A data set is strongly skewed right. Which center and variation measures are most appropriate, and why?',
  'Explain the difference between range, IQR, and standard deviation.',
  'What five values are needed to construct a box-and-whisker plot?',
  'In a two-way table, what denominator do you use for a conditional relative frequency?',
  'How can conditional percentages reveal an association?',
  'Give one example of categorical data and one of quantitative data.',
  'Name two ways a graph can be misleading.',
  'A bell-shaped distribution has mean 40 and SD 2. About what percent lies from 36 to 44?'
 ],more:'Answers should demonstrate all five textbook sections: center/variation, box plots, distribution shape, two-way tables, and data displays.'}
]};
const worksheet=[
 ['center','For 3, 5, 1, 5, 1, 1, 2, 3, 15, find mean, median, and mode. Decide which measure best represents the data and explain the effect of the outlier.'],
 ['variation','For 40, 35, 45, 55, 60, find the range. Explain what standard deviation adds that range does not.'],
 ['transformation','A data set has mean 62, median 55, mode 49, range 46, SD 15.5. Every value increases by 14. Find the new five measures and justify which change.'],
 ['boxplot','Construct the five-number summary for 0,3,4,5,2,4,6,5. Then describe how you would draw the box-and-whisker plot.'],
 ['iqr','A box plot has min 8, Q1 12, median 17, Q3 20, max 28. Find range and IQR and interpret both.'],
 ['shape','A histogram has a long right tail. Name the shape and choose appropriate measures of center and variation. Explain.'],
 ['compare','Set A is symmetric with mean 50 and SD 4. Set B is skewed right with median 53 and IQR 9. Compare them without using inappropriate measures.'],
 ['bell','A bell-shaped distribution has mean 70 and SD 3. Give the 68% and 95% intervals.'],
 ['twoway','Create a two-way table from: 60 males respond, 38 have a job; 70 females respond, 44 have a job. Include all marginal frequencies.'],
 ['relative','Using the table in Question 9, find the joint relative frequency for females with jobs and P(job | female). Explain why the denominators differ.'],
 ['association','In one group 68% choose option A; in another group 31% choose option A. What does this suggest about association? What does it NOT prove?'],
 ['datatype','Classify each as categorical or quantitative: jersey number, height, eye color, test score. Explain the tricky case.'],
 ['display','Choose a display for monthly rainfall over a year and another for comparing test-score distributions of two classes. Justify each.'],
 ['misleading','A graph of wages uses unequal vertical-axis increments. Explain how that can mislead and describe a fair correction.'],
 ['synthesis','A school survey compares grade level with preferred lunch, then wants to communicate results. Describe the table, relative frequency, association check, and display you would use.']
].map((x,i)=>({type:'reasoning',conceptId:'math-ch7-'+x[0],objectiveId:'math-ch7-source',prompt:x[1],guidance:'Show the calculation or statistical decision, then interpret it in context.',answer:'Use the Chapter 7 lesson/source criteria to calculate accurately and justify the statistical choice.'}));
const checks=[
 ['A data set has one very high outlier. Which is usually more resistant: mean or median? Explain.','Median; an extreme value pulls the mean more strongly.'],
 ['What does standard deviation measure?','Typical spread/distance of values from the mean.'],
 ['If Q1=18 and Q3=31, find IQR.','13'],
 ['A distribution has a long left tail. What is its shape?','Skewed left.'],
 ['For a skewed distribution, which center and variation summaries are usually preferred?','Median and five-number summary/IQR.'],
 ['In a two-way table, what are marginal frequencies?','The row and column totals.'],
 ['What is the denominator for P(yes | Grade 10)?','The Grade 10 row/column total specified by the condition.'],
 ['Why compare conditional percentages when looking for association?','They compare category rates on a common within-group basis.'],
 ['Is eye color categorical or quantitative?','Categorical.'],
 ['Name one warning sign of a misleading graph.','Examples: unequal scale intervals, unlabeled axes, truncated scale without a break, inconsistent bar sizes.']
].map((x,i)=>({type:'check',conceptId:'math-ch7-check-'+(i+1),objectiveId:'math-ch7-source-check',prompt:x[0],guidance:'Answer briefly, but include the reason when asked.',answer:x[1]}));
const baseGuide=guideFor,baseWorksheet=worksheetItems,baseKnowledge=knowledgeItems;
guideFor=function(ch){return S.subject==='math'&&Number(ch?.number)===7?guide:baseGuide(ch)};
worksheetItems=function(ch){return S.subject==='math'&&Number(ch?.number)===7?worksheet:baseWorksheet(ch)};
knowledgeItems=function(ch){return S.subject==='math'&&Number(ch?.number)===7?checks:baseKnowledge(ch)};

function openSource(sectionIndex=0){
 if(!isCh7())return;
 let idx=Math.max(0,Math.min(sourceSections.length-1,Number(sectionIndex)||0)),s=sourceSections[idx];
 document.getElementById('math7-source-overlay')?.remove();
 const compact=matchMedia('(max-width:850px)').matches;
 document.body.insertAdjacentHTML('beforeend',`<div id="math7-source-overlay" class="m7src-overlay"><div class="m7src-shell"><header><div><span>Chapter 7 textbook source</span><h2>Data Analysis and Displays · <b data-m7-title>${s.id} ${s.title}</b></h2><p>Use the publisher PDF beside the lesson whenever a graph, table, or worked example needs closer inspection.</p></div><button data-m7-close>Close</button></header><nav>${sourceSections.map((x,i)=>`<button data-m7-section="${i}" class="${i===idx?'active':''}">${x.id} ${x.title}</button>`).join('')}</nav><main><div class="m7src-pdf">${compact?'<div class="m7src-mobile"><p>For Safari/iPad stability, the textbook opens in its own PDF tab.</p><a data-m7-open href="'+s.url+'" target="_blank" rel="noopener">Open '+s.id+' PDF</a></div>':'<iframe data-m7-frame src="'+s.url+'#view=FitH" title="Chapter 7 textbook PDF"></iframe>'}</div><aside><h3>What Liam should learn from this section</h3><div data-m7-objectives></div><p><strong>Important:</strong> the PDF is a reference/source. The website lesson must teach the objective fully even with the PDF closed.</p></aside></main></div></div>`);
 const o=document.getElementById('math7-source-overlay');
 const objectives=[
  ['Compare mean/median/mode; analyze outliers; calculate range and standard deviation; understand data transformations.'],
  ['Construct and interpret box-and-whisker plots; five-number summary; range; IQR; compare spread and shape.'],
  ['Identify symmetric/skewed distributions; choose appropriate center/variation measures; compare distributions; use 68%/95% rules for bell-shaped data.'],
  ['Build/read two-way tables; joint/marginal/conditional relative frequencies; recognize associations from conditional percentages.'],
  ['Distinguish categorical/quantitative data; choose/create appropriate displays; detect and correct misleading graphs.']
 ];
 function select(n){idx=n;s=sourceSections[idx];o.querySelectorAll('[data-m7-section]').forEach((b,i)=>b.classList.toggle('active',i===idx));o.querySelector('[data-m7-title]').textContent=s.id+' '+s.title;o.querySelector('[data-m7-objectives]').innerHTML='<ul>'+objectives[idx].map(x=>'<li>'+x+'</li>').join('')+'</ul>';const fr=o.querySelector('[data-m7-frame]');if(fr)fr.src=s.url+'#view=FitH';const a=o.querySelector('[data-m7-open]');if(a){a.href=s.url;a.textContent='Open '+s.id+' PDF'}}
 o.querySelector('[data-m7-close]').onclick=()=>o.remove();o.querySelectorAll('[data-m7-section]').forEach(b=>b.onclick=()=>select(Number(b.dataset.m7Section)));select(idx);
}
function inject(){
 if(!isCh7()||S.view!=='chapter'||document.getElementById('math7-source-open'))return;
 const tabs=document.querySelector('.tabs');if(!tabs)return;
 const b=document.createElement('button');b.id='math7-source-open';b.className='tab';b.textContent='📖 Chapter 7 Textbook PDFs';b.onclick=()=>openSource(0);tabs.appendChild(b);
}
document.addEventListener('click',e=>{if(e.target.closest('[data-subject],button,a'))setTimeout(inject,0)},true);
const css=document.createElement('style');css.textContent=`.m7src-overlay{position:fixed;inset:0;background:rgba(10,20,30,.76);z-index:100000;padding:14px}.m7src-shell{height:100%;background:#fff;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}.m7src-shell header{display:flex;justify-content:space-between;gap:16px;padding:14px 18px;border-bottom:1px solid #dce4e8}.m7src-shell header span{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#476}.m7src-shell header h2{margin:3px 0}.m7src-shell header p{margin:3px 0}.m7src-shell header button{align-self:flex-start}.m7src-shell nav{display:flex;gap:6px;padding:8px;overflow:auto;border-bottom:1px solid #dce4e8}.m7src-shell nav button{white-space:nowrap;padding:8px 10px;border:1px solid #c8d4d9;border-radius:8px;background:#fff}.m7src-shell nav button.active{background:#e8f5f0;border-color:#6fae99}.m7src-shell main{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(280px,.55fr);min-height:0;flex:1}.m7src-pdf iframe{width:100%;height:100%;border:0}.m7src-shell aside{padding:18px;overflow:auto;background:#f7faf9}.m7src-shell aside li{margin:8px 0;line-height:1.45}.m7src-mobile{padding:24px}.m7src-mobile a{display:inline-block;padding:12px 16px;border-radius:9px;background:#17324f;color:white;text-decoration:none}@media(max-width:850px){.m7src-overlay{padding:0}.m7src-shell{border-radius:0}.m7src-shell main{display:block;overflow:auto}.m7src-pdf{min-height:150px}.m7src-shell aside{overflow:visible}}`;document.head.appendChild(css);
window.openMath7Source=openSource;window.auditMath7SourceAlignment=()=>({sections:sourceSections.length,guideBlocks:guide.steps.length,worksheet:worksheet.length,knowledge:checks.length,passed:sourceSections.length===5&&guide.steps.length>=13&&worksheet.length===15&&checks.length>=10});
try{inject()}catch(e){console.error('Math Chapter 7 source alignment:',e)}
})();