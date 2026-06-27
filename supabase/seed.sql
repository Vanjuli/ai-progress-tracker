-- Starter data for AI Progress Tracker. Run ONCE on a fresh database, after schema.sql.
--
-- NOTE: these figures are widely-cited, APPROXIMATE starting points meant to be
-- refined by the community — which is the whole point of the app. Treat them as
-- illustrative, not authoritative. They are inserted as curated ("protected")
-- verified rows so community votes won't silently flip them.

-- ---- Fields ---------------------------------------------------------------
insert into public.fields (slug, name, description, color, sort_order) values
  ('language', 'Language & Reasoning', 'Knowledge, comprehension, and reasoning in large language models.', '#6366f1', 1),
  ('coding',   'Code Generation',      'Writing correct, functional code from natural-language prompts.',     '#10b981', 2),
  ('vision',   'Computer Vision',      'Image classification, detection, and visual understanding.',          '#f59e0b', 3),
  ('math',     'Mathematics',          'Multi-step mathematical problem solving.',                            '#ef4444', 4),
  ('speech',   'Speech Recognition',   'Transcribing spoken audio to text.',                                  '#06b6d4', 5)
on conflict (slug) do nothing;

-- ---- Benchmarks -----------------------------------------------------------
insert into public.benchmarks (field_id, slug, name, description, unit, higher_is_better, source_url) values
  ((select id from public.fields where slug = 'language'), 'mmlu', 'MMLU', 'Massive Multitask Language Understanding (57 subjects).', '%', true, 'https://paperswithcode.com/sota/multi-task-language-understanding-on-mmlu'),
  ((select id from public.fields where slug = 'coding'),   'humaneval', 'HumanEval', 'Functional correctness of generated Python (pass@1).', '%', true, 'https://paperswithcode.com/sota/code-generation-on-humaneval'),
  ((select id from public.fields where slug = 'vision'),   'imagenet', 'ImageNet Top-1', 'Top-1 classification accuracy on ImageNet.', '%', true, 'https://paperswithcode.com/sota/image-classification-on-imagenet'),
  ((select id from public.fields where slug = 'math'),     'gsm8k', 'GSM8K', 'Grade-school math word problems.', '%', true, 'https://paperswithcode.com/sota/arithmetic-reasoning-on-gsm8k'),
  ((select id from public.fields where slug = 'math'),     'math-comp', 'MATH', 'Competition mathematics problems (Hendrycks et al., 2021).', '%', true, 'https://arxiv.org/abs/2103.03874'),
  ((select id from public.fields where slug = 'math'),     'aime-2024', 'AIME 2024', 'American Invitational Mathematics Examination (2024).', '%', true, 'https://openai.com/index/learning-to-reason-with-llms/'),
  ((select id from public.fields where slug = 'speech'),   'librispeech', 'LibriSpeech WER', 'Word error rate on LibriSpeech test-clean (lower is better).', '% WER', false, 'https://paperswithcode.com/sota/speech-recognition-on-librispeech-test-clean')
on conflict (field_id, slug) do nothing;

-- ---- Data points ----------------------------------------------------------
-- Real, sourced figures. `notes` records the evaluation method/conditions, which
-- matter because these benchmarks are NOT always apples-to-apples (prompting,
-- extra pretraining data, LM use, zero-shot vs fine-tuned). Recent rows on
-- saturated benchmarks (HumanEval, GSM8K) are flagged where vendor-authoritative
-- numbers no longer exist.
insert into public.data_points (benchmark_id, model_name, organization, score, achieved_on, source_url, notes, protected, status, vote_score)
select b.id, d.model_name, d.organization, d.score, d.achieved_on::date, d.source_url, d.notes, true, 'verified', 3
from public.benchmarks b
join (values
  -- MMLU (% accuracy). Plain MMLU saturates ~90-92% from 2024; labs then report MMLU-Pro.
  ('mmlu','GPT-3','OpenAI',43.9,'2020-09-07','https://arxiv.org/abs/2009.03300','Few-shot (original MMLU paper).'),
  ('mmlu','GPT-4','OpenAI',86.4,'2023-03-14','https://arxiv.org/abs/2303.08774','5-shot.'),
  ('mmlu','Gemini Ultra 1.0','Google',90.0,'2023-12-06','https://arxiv.org/abs/2312.11805','CoT@32 majority vote; first to cross ~89.8% human-expert estimate.'),
  ('mmlu','Claude 3 Opus','Anthropic',86.8,'2024-03-04','https://www.anthropic.com/news/claude-3-family','5-shot.'),
  ('mmlu','GPT-5','OpenAI',92.5,'2025-08-07','https://llm-stats.com/benchmarks/mmlu','Third-party aggregate; modern labs report MMLU-Pro, not plain MMLU. Verify.'),
  -- HumanEval (pass@1). Saturated since ~2024; vendors moved to SWE-bench.
  ('humaneval','Codex (12B)','OpenAI',28.8,'2021-07-07','https://arxiv.org/abs/2107.03374','12B model, temp 0.2.'),
  ('humaneval','GPT-4','OpenAI',67.0,'2023-03-14','https://arxiv.org/abs/2303.08774','Canonical tech-report value (0-shot).'),
  ('humaneval','GPT-4o','OpenAI',90.2,'2024-05-13','https://en.wikipedia.org/wiki/GPT-4o','Widely reported; secondary source.'),
  ('humaneval','DeepSeek-Coder-V2','DeepSeek',90.2,'2024-06-17','https://arxiv.org/abs/2406.11931','Instruct model.'),
  ('humaneval','Claude Opus 4','Anthropic',94.5,'2025-05-01','https://www.anthropic.com/news/claude-4','Third-party study; vendors report SWE-bench now. Verify.'),
  -- ImageNet Top-1. From ViT on, top scores use large extra pretraining (JFT) - not comparable to ImageNet-only training.
  ('imagenet','AlexNet','Univ. of Toronto',63.3,'2012-09-30','https://en.wikipedia.org/wiki/AlexNet','Top-1 derived from paper''s top-5 error; ImageNet-only.'),
  ('imagenet','ResNet-152','Microsoft Research',78.6,'2015-12-10','https://arxiv.org/abs/1512.03385','Single-crop top-1; ImageNet-only.'),
  ('imagenet','EfficientNet-B7','Google Brain',84.3,'2019-05-28','https://arxiv.org/abs/1905.11946','ImageNet-only.'),
  ('imagenet','ViT-H/14','Google Research',88.55,'2020-10-22','https://arxiv.org/abs/2010.11929','Pretrained on JFT-300M.'),
  ('imagenet','CoAtNet-7','Google Research',90.88,'2021-06-09','https://arxiv.org/abs/2106.04803','Pretrained on JFT-3B.'),
  ('imagenet','CoCa','Google Research',91.0,'2022-05-04','https://arxiv.org/abs/2205.01917','Image-text pretraining (JFT + ALIGN).'),
  -- GSM8K (% accuracy). Saturated by mid-2024; later models report MATH/AIME instead.
  ('gsm8k','GPT-3 175B','OpenAI',55.0,'2021-10-27','https://arxiv.org/abs/2110.14168','Fine-tuned + verifiers (best-of-N); ~commonly cited.'),
  ('gsm8k','PaLM 540B','Google',74.4,'2022-03-21','https://arxiv.org/abs/2203.11171','8-shot CoT + self-consistency (maj@40).'),
  ('gsm8k','GPT-4','OpenAI',92.0,'2023-03-14','https://arxiv.org/abs/2303.08774','5-shot CoT.'),
  ('gsm8k','Gemini Ultra 1.0','Google',94.4,'2023-12-06','https://arxiv.org/abs/2312.11805','CoT maj1@32.'),
  ('gsm8k','Claude 3.5 Sonnet','Anthropic',96.4,'2024-06-20','https://www.anthropic.com/news/claude-3-5-sonnet','0-shot CoT.'),
  ('gsm8k','Llama 3.1 405B','Meta',96.8,'2024-07-23','https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md','8-shot CoT.'),
  -- MATH (% accuracy). Competition-level; the 2024 reasoning models jump sharply.
  ('math-comp','Minerva 540B','Google',50.3,'2022-06-29','https://arxiv.org/abs/2206.14858','Math-specialized; majority voting.'),
  ('math-comp','GPT-4','OpenAI',42.5,'2023-03-14','https://arxiv.org/abs/2303.08774','Few-shot, general model.'),
  ('math-comp','GPT-4o','OpenAI',76.6,'2024-05-13','https://openai.com/index/hello-gpt-4o/','General model.'),
  ('math-comp','o1','OpenAI',94.8,'2024-09-12','https://openai.com/index/learning-to-reason-with-llms/','RL reasoning model.'),
  -- AIME 2024 (% of problems solved). Steep 2024 reasoning-model climb.
  ('aime-2024','GPT-4o','OpenAI',12.0,'2024-05-13','https://openai.com/index/learning-to-reason-with-llms/','Avg 1.8/15 problems.'),
  ('aime-2024','o1','OpenAI',74.4,'2024-09-12','https://openai.com/index/learning-to-reason-with-llms/','Single sample per problem.'),
  ('aime-2024','o3','OpenAI',96.7,'2024-12-20','https://www.datacamp.com/blog/o3-openai','OpenAI o3 (Dec 2024); third-party report.'),
  -- LibriSpeech test-clean WER (lower is better).
  ('librispeech','Deep Speech 2','Baidu Research',5.33,'2015-12-08','https://arxiv.org/abs/1512.02595','With external LM.'),
  ('librispeech','Conformer (L)','Google',1.9,'2020-05-16','https://arxiv.org/abs/2005.08100','With LM (no-LM ~2.1%).'),
  ('librispeech','wav2vec 2.0','Meta',1.8,'2020-06-20','https://arxiv.org/abs/2006.11477','LARGE, with LM.'),
  ('librispeech','Conformer + Noisy Student','Google Brain',1.4,'2020-10-20','https://arxiv.org/abs/2010.10504','Semi-supervised.'),
  ('librispeech','Whisper (large)','OpenAI',2.5,'2022-12-06','https://arxiv.org/abs/2212.04356','Zero-shot (not fine-tuned on LibriSpeech) - reflects robustness.'),
  ('librispeech','Zipformer-L','Xiaomi / k2',2.00,'2023-10-17','https://arxiv.org/abs/2310.11230','No external LM.')
) as d(bslug, model_name, organization, score, achieved_on, source_url, notes)
  on d.bslug = b.slug;

-- ---- Field metrics ---------------------------------------------------------
-- MARKET VALUE ("net worth"): REAL figures from Grand View Research (USD billions).
-- Yearly points are geometrically interpolated between GVR's reported real endpoints
-- (e.g. NLP $59.7B in 2024 -> $439.85B by 2030). Mathematics has no distinct market
-- segment, so it carries no market-value series.
insert into public.field_metrics (field_id, metric_key, period, value, unit, source_url)
select f.id, 'market_value', make_date(m.yr, 1, 1), m.value, 'USD_billion', m.src
from public.fields f
join (values
  ('language',2024,59.70,'https://www.grandviewresearch.com/industry-analysis/natural-language-processing-market-report'),
  ('language',2025,83.3, 'https://www.grandviewresearch.com/industry-analysis/natural-language-processing-market-report'),
  ('language',2026,116.2,'https://www.grandviewresearch.com/industry-analysis/natural-language-processing-market-report'),
  ('language',2027,162.0,'https://www.grandviewresearch.com/industry-analysis/natural-language-processing-market-report'),
  ('language',2028,226.0,'https://www.grandviewresearch.com/industry-analysis/natural-language-processing-market-report'),
  ('language',2029,315.3,'https://www.grandviewresearch.com/industry-analysis/natural-language-processing-market-report'),
  ('language',2030,439.85,'https://www.grandviewresearch.com/industry-analysis/natural-language-processing-market-report'),
  ('vision',2024,19.82,'https://www.grandviewresearch.com/industry-analysis/computer-vision-market'),
  ('vision',2025,23.7, 'https://www.grandviewresearch.com/industry-analysis/computer-vision-market'),
  ('vision',2026,28.4, 'https://www.grandviewresearch.com/industry-analysis/computer-vision-market'),
  ('vision',2027,34.0, 'https://www.grandviewresearch.com/industry-analysis/computer-vision-market'),
  ('vision',2028,40.7, 'https://www.grandviewresearch.com/industry-analysis/computer-vision-market'),
  ('vision',2029,48.7, 'https://www.grandviewresearch.com/industry-analysis/computer-vision-market'),
  ('vision',2030,58.29,'https://www.grandviewresearch.com/industry-analysis/computer-vision-market'),
  ('speech',2023,20.25,'https://www.grandviewresearch.com/industry-analysis/voice-recognition-market'),
  ('speech',2024,23.70,'https://www.grandviewresearch.com/industry-analysis/voice-recognition-market'),
  ('speech',2025,27.2, 'https://www.grandviewresearch.com/industry-analysis/voice-recognition-market'),
  ('speech',2026,31.1, 'https://www.grandviewresearch.com/industry-analysis/voice-recognition-market'),
  ('speech',2027,35.7, 'https://www.grandviewresearch.com/industry-analysis/voice-recognition-market'),
  ('speech',2028,40.9, 'https://www.grandviewresearch.com/industry-analysis/voice-recognition-market'),
  ('speech',2029,46.8, 'https://www.grandviewresearch.com/industry-analysis/voice-recognition-market'),
  ('speech',2030,53.67,'https://www.grandviewresearch.com/industry-analysis/voice-recognition-market'),
  ('coding',2023,4.86, 'https://www.grandviewresearch.com/industry-analysis/ai-code-tools-market-report'),
  ('coding',2024,6.18, 'https://www.grandviewresearch.com/industry-analysis/ai-code-tools-market-report'),
  ('coding',2025,7.85, 'https://www.grandviewresearch.com/industry-analysis/ai-code-tools-market-report'),
  ('coding',2026,9.98, 'https://www.grandviewresearch.com/industry-analysis/ai-code-tools-market-report'),
  ('coding',2027,12.68,'https://www.grandviewresearch.com/industry-analysis/ai-code-tools-market-report'),
  ('coding',2028,16.1, 'https://www.grandviewresearch.com/industry-analysis/ai-code-tools-market-report'),
  ('coding',2029,20.5, 'https://www.grandviewresearch.com/industry-analysis/ai-code-tools-market-report'),
  ('coding',2030,26.03,'https://www.grandviewresearch.com/industry-analysis/ai-code-tools-market-report')
) as m(fslug, yr, value, src)
  on m.fslug = f.slug
on conflict (field_id, metric_key, period) do nothing;

-- POPULARITY: REAL research-activity proxy — annual submission counts to each
-- field's main arXiv category (cs.CL, cs.CV, cs.SE, eess.AS), pulled from the arXiv
-- API. Mathematics has no clean AI-specific category, so it has no popularity series.
insert into public.field_metrics (field_id, metric_key, period, value, unit, source_url)
select f.id, 'popularity', make_date(m.yr, 1, 1), m.value, 'papers', m.src
from public.fields f
join (values
  ('language',2018,3729,'https://arxiv.org/list/cs.CL/recent'),('language',2019,5393,'https://arxiv.org/list/cs.CL/recent'),('language',2020,7125,'https://arxiv.org/list/cs.CL/recent'),('language',2021,8083,'https://arxiv.org/list/cs.CL/recent'),('language',2022,8971,'https://arxiv.org/list/cs.CL/recent'),('language',2023,13601,'https://arxiv.org/list/cs.CL/recent'),('language',2024,20689,'https://arxiv.org/list/cs.CL/recent'),('language',2025,23756,'https://arxiv.org/list/cs.CL/recent'),
  ('vision',2018,8591,'https://arxiv.org/list/cs.CV/recent'),('vision',2019,11601,'https://arxiv.org/list/cs.CV/recent'),('vision',2020,15340,'https://arxiv.org/list/cs.CV/recent'),('vision',2021,17203,'https://arxiv.org/list/cs.CV/recent'),('vision',2022,19692,'https://arxiv.org/list/cs.CV/recent'),('vision',2023,24523,'https://arxiv.org/list/cs.CV/recent'),('vision',2024,30584,'https://arxiv.org/list/cs.CV/recent'),('vision',2025,34978,'https://arxiv.org/list/cs.CV/recent'),
  ('coding',2018,1014,'https://arxiv.org/list/cs.SE/recent'),('coding',2019,1187,'https://arxiv.org/list/cs.SE/recent'),('coding',2020,1520,'https://arxiv.org/list/cs.SE/recent'),('coding',2021,2165,'https://arxiv.org/list/cs.SE/recent'),('coding',2022,1990,'https://arxiv.org/list/cs.SE/recent'),('coding',2023,2716,'https://arxiv.org/list/cs.SE/recent'),('coding',2024,3690,'https://arxiv.org/list/cs.SE/recent'),('coding',2025,5184,'https://arxiv.org/list/cs.SE/recent'),
  ('speech',2018,875,'https://arxiv.org/list/eess.AS/recent'),('speech',2019,1410,'https://arxiv.org/list/eess.AS/recent'),('speech',2020,2180,'https://arxiv.org/list/eess.AS/recent'),('speech',2021,2426,'https://arxiv.org/list/eess.AS/recent'),('speech',2022,2987,'https://arxiv.org/list/eess.AS/recent'),('speech',2023,3214,'https://arxiv.org/list/eess.AS/recent'),('speech',2024,3703,'https://arxiv.org/list/eess.AS/recent'),('speech',2025,3514,'https://arxiv.org/list/eess.AS/recent')
) as m(fslug, yr, value, src)
  on m.fslug = f.slug
on conflict (field_id, metric_key, period) do nothing;

-- Curated metric rows (no submitter) are verified and protected from community votes.
update public.field_metrics set status = 'verified', protected = true where submitted_by is null;
