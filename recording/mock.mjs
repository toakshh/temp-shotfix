// Synthetic data for the ShotFix demo recording. Nothing here comes from a real user, video or analysis:
// the brand ("Daybreak"), the studio, the people and every number are made up for the walkthrough.
const iso = (minsAgo) => new Date(Date.UTC(2026, 10, 12, 10, 0, 0) - minsAgo * 60000).toISOString();
const M = '/media';

export const VIDEO_ID = 'vid_daybreak03';
export const JOB_ID = 'job_daybreak03';

export const user = {
  id: 'usr_demo', name: 'Ines Duarte', email: 'ines@northlight.example', orgName: 'Northlight Studio', accountType: 'business',
  role: 'USER', credits: 118, preferences: { analysisMode: 'fast', autoAnalyze: true, defaultPlatforms: [], notifications: false },
};

export const catalog = {
  categories: [
    { id: 'consistency', label: 'Consistency', weight: 0.15 },
    { id: 'visual_quality', label: 'Visual quality', weight: 0.2 },
    { id: 'emotion_engagement', label: 'Emotion & engagement', weight: 0.15 },
    { id: 'script_content', label: 'Script & content', weight: 0.15 },
    { id: 'viral_potential', label: 'Viral potential', weight: 0.25 },
    { id: 'compliance', label: 'Compliance', weight: 0.1 },
  ],
  platforms: [
    { id: 'youtube', label: 'YouTube', aspect: ['16:9'], max_duration_sec: 43200, loudness_target: -14 },
    { id: 'youtube_shorts', label: 'YouTube Shorts', aspect: ['9:16'], max_duration_sec: 180, loudness_target: -14 },
    { id: 'instagram_reels', label: 'Instagram Reels', aspect: ['9:16'], max_duration_sec: 180, loudness_target: -14 },
    { id: 'instagram_feed', label: 'Instagram Feed', aspect: ['1:1', '4:5'], max_duration_sec: 3600, loudness_target: -14 },
    { id: 'tiktok', label: 'TikTok', aspect: ['9:16'], max_duration_sec: 600, loudness_target: -14 },
    { id: 'linkedin', label: 'LinkedIn', aspect: ['16:9', '1:1', '4:5'], max_duration_sec: 900, loudness_target: -16 },
    { id: 'x', label: 'X (Twitter)', aspect: ['16:9', '1:1'], max_duration_sec: 140, loudness_target: -16 },
  ],
  industries: [
    { id: 'general', label: 'General' }, { id: 'health_wellness', label: 'Health & wellness' }, { id: 'finance', label: 'Finance & crypto' },
    { id: 'alcohol', label: 'Alcohol' }, { id: 'kids', label: 'Kids & family' }, { id: 'consumer_electronics', label: 'Consumer electronics' },
    { id: 'beauty', label: 'Beauty & cosmetics' }, { id: 'gaming', label: 'Gaming' },
  ],
  severities: ['critical', 'major', 'minor', 'info'],
  ai_enabled: true, signup_enabled: false, video_generation: false,
  credits: { signup: 10, perAnalysisMinute: 1, perMinute: { fast: 1, detailed: 3 }, perRegeneration: 5 },
  analysis_modes: { default: 'fast', modes: {} },
};

// earlier analyses on the dashboard
const past = [
  { id: 'vid_trail01', title: 'Trailhead boots 15s bumper', platforms: ['youtube', 'instagram_feed'], d: 15, score: 91, verdict: 'ready', findings: 3, critical: 0, mode: 'detailed', ago: 60 * 26, thumb: 'past_1.jpg' },
  { id: 'vid_found02', title: 'Founder Q&A cutdown 2', platforms: ['linkedin'], d: 48, score: 77, verdict: 'minor_fixes', findings: 7, critical: 0, mode: 'fast', ago: 60 * 50, thumb: 'past_2.jpg' },
  { id: 'vid_drop03', title: 'Spring drop teaser (AI cut)', platforms: ['tiktok', 'instagram_reels'], d: 21, score: 44, verdict: 'major_rework', findings: 14, critical: 3, mode: 'detailed', ago: 60 * 75, thumb: 'past_3.jpg' },
  { id: 'vid_lofi04', title: 'Lo-fi study loop, episode 12', platforms: ['youtube'], d: 36, score: 86, verdict: 'ready', findings: 2, critical: 0, mode: 'fast', ago: 60 * 120, thumb: 'past_4.jpg' },
];
export const pastVideos = past.map((p) => ({
  id: p.id, title: p.title, status: 'ANALYZED', latestJobId: `job_${p.id}`, platforms: p.platforms, projectId: null, industry: 'general',
  metadata: { durationSeconds: p.d }, createdAt: iso(p.ago), thumbUrl: `${M}/${p.thumb}`,
  summary: { overallScore: p.score, verdict: p.verdict, findingsCount: p.findings, criticalCount: p.critical, aiStatus: 'completed', analysisMode: p.mode },
}));

export const stats = (withNew) => ({
  analyzed: withNew ? 5 : 4, total: withNew ? 5 : 4, minutesAnalyzed: withNew ? 3 : 2, processing: 0, failed: 0,
  avgScore: withNew ? 71 : 75, criticalFindings: withNew ? 5 : 3, credits: withNew ? 115 : 118,
});

export const brief = {
  title: 'Daybreak Yuzu launch spot v3',
  description: 'Summer launch spot for Daybreak, a yuzu sparkling soda. Product hero, three benefit lines, end card.',
  goal: 'Drive pre-orders for the June launch',
  audience: '18-30, US and UK, drinks soda over coffee',
  platforms: ['instagram_reels', 'tiktok', 'youtube'],
  industry: 'health_wellness', brand: 'Daybreak', cta: 'Shop at daybreak.example', language: '',
  referenceNotes: 'The can is coral pink (#FF6F61) with the sunrise logo facing camera in every shot.\nNo health or performance claims.',
};

export const newVideo = (status) => ({
  id: VIDEO_ID, userId: 'usr_demo', title: brief.title, description: brief.description, goal: brief.goal, audience: brief.audience,
  platforms: brief.platforms, industry: brief.industry, brand: brief.brand, language: '', aiEnabled: true,
  referenceNotes: `Expected call-to-action: ${brief.cta}\n\n${brief.referenceNotes}`,
  status, latestJobId: JOB_ID, projectId: null, shares: [], frameCount: 72,
  metadata: { durationSeconds: 24, resolution: '1920x1080', fps: 30, width: 1920, height: 1080 },
  storage: { originalName: 'daybreak_yuzu_launch_v3.mp4' },
  createdAt: iso(1), thumbUrl: `${M}/thumb_05.jpg`,
  summary: status === 'ANALYZED' ? { overallScore: 58, verdict: 'needs_work', findingsCount: 11, criticalCount: 2, aiStatus: 'completed', analysisMode: 'detailed', thumbKey: 'x' } : {},
});

export const STAGES = ['preprocessing', 'speechToText', 'videoAnalysis', 'audioAnalysis', 'textAnalysis', 'aiSlopDetector', 'consistencyEngine', 'viralPotential', 'industryGuardrails', 'scoring', 'suggestions', 'evidence'];
export const job = (status = 'PROCESSING') => ({
  id: JOB_ID, videoId: VIDEO_ID, userId: 'usr_demo', mode: 'detailed', status, progress: status === 'COMPLETED' ? 100 : 2,
  currentStep: status === 'COMPLETED' ? 'Analysis completed' : 'Queued', attempts: 1, creditsCharged: 3, error: null,
  pipelineStages: Object.fromEntries(STAGES.map((s) => [s, { status: status === 'COMPLETED' ? 'COMPLETED' : 'PENDING', progress: 0, durationMs: 0 }])),
  events: status === 'COMPLETED' ? [] : [{ ts: iso(0.4), level: 'info', message: 'Upload verified · 24.0s · 1920×1080 · 30 fps' }, { ts: iso(0.35), level: 'info', message: 'Detailed analysis queued · 3 credits charged' }],
  createdAt: iso(1), startedAt: iso(1), completedAt: status === 'COMPLETED' ? iso(0) : null, usage: { cost_usd: 0.41 },
});

const fr = (role, t, file, regions) => ({ role, t, url: `${M}/${file}`, regions });
const finding = (o) => ({ reference_sec: null, suggestion: null, regenerate_prompt: null, fix_command: null, platform: null, confidence: 0.9, review: { status: 'open' }, also_flagged_by: [], ...o });

export const findings = [
  finding({
    id: 'f_001', category: 'consistency', source: 'consistency_engine', subcategory: 'product_colour_drift', severity: 'critical', start_sec: 8.0, end_sec: 12.5, reference_sec: 5.0,
    title: 'The can turns from coral to orange in shot 3',
    description: 'Your reference notes fix the can as coral pink (#FF6F61) with the sunrise logo to camera. In the close-up it renders orange (#FF8A1F) and the logo band faces away, so it reads as a different flavour.',
    evidence: 'Reference at 0:05.0: coral can, logo facing camera. Issue at 0:08.0: orange can, nutrition panel facing camera.',
    suggestion: 'Regenerate shot 3 with the 0:05.0 frame as the image reference, or grade the can back to #FF6F61 and flip the label.',
    confidence: 0.96, also_flagged_by: ['ai_slop'],
    frames: [fr('reference', 5.0, 'ev_f001_ref.jpg', [{ label: 'Coral can, logo to camera', x: 0.577, y: 0.228, w: 0.133, h: 0.44 }]), fr('issue', 8.05, 'ev_f001_issue.jpg', [{ label: 'Orange can, logo turned away', x: 0.254, y: 0.155, w: 0.292, h: 0.8 }])],
  }),
  finding({
    id: 'f_002', category: 'compliance', source: 'guardrails', subcategory: 'unsupported_health_claim', severity: 'critical', start_sec: 14.8, end_sec: 17.3,
    title: '“Clinically proven focus” is an unsupported health claim',
    description: 'A cognitive benefit claim on a soda, with an asterisk and no disclaimer. The brief says no health or performance claims, and Health & wellness guardrails flag it.',
    evidence: 'On-screen text at 0:14.8 to 0:17.3: “Clinically proven focus.*”',
    suggestion: 'Cut the line or replace it with a product fact, e.g. “Made with real yuzu peel.”',
    confidence: 0.94,
    frames: [fr('issue', 15.6, 'ev_f002_issue.jpg', [{ label: 'Health claim with asterisk', x: 0.25, y: 0.16, w: 0.5, h: 0.29 }])],
  }),
  finding({
    id: 'f_003', category: 'viral_potential', source: 'viral_potential:signals', subcategory: 'aspect_ratio', severity: 'major', start_sec: 0, end_sec: 24, platform: 'tiktok',
    title: 'Delivered 16:9, but TikTok and Reels expect 9:16',
    description: 'Two of the three target platforms are vertical. As delivered, the can sits in a letterboxed strip on a phone.',
    evidence: '1920×1080 delivered; TikTok and Instagram Reels expect 9:16.', confidence: 1,
  }),
  finding({
    id: 'f_004', category: 'visual_quality', source: 'ai_slop', subcategory: 'garbled_text', severity: 'major', start_sec: 14.8, end_sec: 17.5,
    title: 'Garbled lettering on the can label',
    description: 'The label reads “DAYBR3AK” and “SPARKLNIG” in shot 4, a typical AI text artefact on a product the viewer is meant to recognise.',
    evidence: 'Label text at 0:15.6 differs from the 0:05.0 reference.', confidence: 0.88,
    frames: [fr('reference', 5.0, 'ev_f004_ref.jpg', [{ label: 'Correct wordmark', x: 0.588, y: 0.465, w: 0.1, h: 0.075 }]), fr('issue', 15.6, 'ev_f004_issue.jpg', [{ label: 'Garbled wordmark', x: 0.455, y: 0.6, w: 0.08, h: 0.06 }])],
  }),
  finding({
    id: 'f_005', category: 'viral_potential', source: 'viral_potential', subcategory: 'slow_hook', severity: 'major', start_sec: 0, end_sec: 3.2,
    title: 'The product only reads at 2.8s',
    description: 'The opening is a dark silhouette rising slowly; on a feed most viewers decide in the first second.',
    evidence: 'Hook strength 48/100. Can recognisable from 0:02.8.', confidence: 0.82,
    frames: [fr('issue', 1.2, 'ev_f005_issue.jpg', [{ label: 'Unlit silhouette', x: 0.42, y: 0.25, w: 0.156, h: 0.52 }])],
  }),
  finding({
    id: 'f_006', category: 'visual_quality', source: 'video_analysis:signals', subcategory: 'black_frames', severity: 'major', start_sec: 17.5, end_sec: 18.1,
    title: 'Black frames for 0.6s before the end card',
    description: 'A stretch of black frames in the middle of the video reads as a mistake and causes drop-off.',
    evidence: 'Measured black frames from 17.5s to 18.1s.', confidence: 1,
    fix_command: "ffmpeg -i daybreak_v3.mp4 -vf \"select='not(between(t,17.5,18.1))',setpts=N/FRAME_RATE/TB\" -af \"aselect='not(between(t,17.5,18.1))',asetpts=N/SR/TB\" daybreak_v4.mp4",
  }),
  finding({
    id: 'f_007', category: 'script_content', source: 'text_analysis', subcategory: 'late_cta', severity: 'minor', start_sec: 22.6, end_sec: 24,
    title: 'The call to action is on screen for 1.4s',
    description: '“Shop at daybreak.example” arrives in the last 1.4 seconds, after most viewers have scrolled.', confidence: 0.86,
    frames: [fr('issue', 23.2, 'ev_f007_issue.jpg', [{ label: 'Late call to action', x: 0.37, y: 0.905, w: 0.26, h: 0.05 }])],
  }),
  finding({
    id: 'f_008', category: 'emotion_engagement', source: 'audio_analysis:signals', subcategory: 'loudness', severity: 'minor', start_sec: 0, end_sec: 24,
    title: 'Mix is 4.8 LU louder than the platform target',
    description: 'Integrated loudness is −9.2 LUFS against a −14 LUFS target, so platforms will turn it down and the music will lose punch.', confidence: 1,
  }),
  finding({
    id: 'f_009', category: 'visual_quality', source: 'video_analysis', subcategory: 'clipped_highlight', severity: 'minor', start_sec: 4.4, end_sec: 5.6,
    title: 'Light sweep clips to white on the can',
    description: 'The highlight burns out the label for about a second as the sweep passes.', confidence: 0.71,
  }),
  finding({
    id: 'f_010', category: 'compliance', source: 'guardrails', subcategory: 'missing_disclaimer', severity: 'minor', start_sec: 14.8, end_sec: 17.3,
    title: 'Asterisk with no disclaimer', description: 'The claim carries an asterisk but no footnote appears anywhere in the video.', confidence: 0.9,
  }),
  finding({
    id: 'f_011', category: 'script_content', source: 'text_analysis', subcategory: 'brand_mention', severity: 'info', start_sec: 0, end_sec: 3.4,
    title: 'Brand name first heard at 3.4s', description: 'Saying “Daybreak” over the opening would tie the hook to the brand.', confidence: 0.7,
  }),
];

const thumbs = Array.from({ length: 12 }, (_, i) => ({ t: Number((i * 2 + 0.6).toFixed(1)), url: `${M}/thumb_${String(i).padStart(2, '0')}.jpg` }));
const curve = (n, f) => Array.from({ length: n }, (_, i) => f(i, i / (n - 1)));

export const report = {
  generated_at: iso(0), analysis_mode: 'detailed',
  video: { id: VIDEO_ID, title: brief.title, duration_sec: 24, resolution: '1920x1080', aspect_ratio: '16:9', fps: 30, has_audio: true, platforms: brief.platforms, industry: 'health_wellness' },
  ai: {
    status: 'completed', provider: 'vertex', mode: 'detailed',
    models: { perception: 'gemini-2.5-flash', reasoning: 'gemini-2.5-pro' },
    passes: Object.fromEntries(['video_analysis', 'audio_analysis', 'text_analysis', 'ai_slop', 'consistency_engine', 'viral_potential', 'guardrails', 'suggestions', 'evidence_markup'].map((k) => [k, { status: 'completed' }])),
    usage: { cost_usd: 0.41 },
  },
  overall_score: 58, verdict: 'needs_work',
  scores: {
    consistency: { label: 'Consistency', score: 41, weight: 0.15, findings: 1, confidence: 'high' },
    visual_quality: { label: 'Visual quality', score: 66, weight: 0.2, findings: 3, confidence: 'high' },
    emotion_engagement: { label: 'Emotion & engagement', score: 74, weight: 0.15, findings: 1, confidence: 'medium' },
    script_content: { label: 'Script & content', score: 71, weight: 0.15, findings: 2, confidence: 'high' },
    viral_potential: { label: 'Viral potential', score: 52, weight: 0.25, findings: 2, confidence: 'medium' },
    compliance: { label: 'Compliance', score: 38, weight: 0.1, findings: 2, confidence: 'high' },
  },
  summary: 'A polished launch spot held back by one continuity break and one claim. The can turns from coral to orange in the close-up, so it reads as a different flavour, and “Clinically proven focus” is a health claim the brief rules out. Cut a 9:16 version for TikTok and Reels, open on the lit can, and land the call to action over the end card.',
  strengths: ['Dawn palette matches the brand and holds across shots', 'Clear product hero in shot 2 with a readable label', 'Average shot of 4.6s keeps the pace without dead air'],
  top_priorities: ['f_001', 'f_002', 'f_003', 'f_004', 'f_005'],
  findings,
  transcript: {
    language: 'en', lines: [
      { start_sec: 0.4, end_sec: 2.9, speaker: 'VO1', text: 'Something’s rising.', tone: 'hushed' },
      { start_sec: 3.4, end_sec: 6.8, speaker: 'VO1', text: 'Meet Daybreak. Sparkling yuzu soda.', tone: 'warm' },
      { start_sec: 8.3, end_sec: 11.6, speaker: 'VO1', text: 'Bright, sharp, and ice cold.', tone: 'upbeat' },
      { start_sec: 12.8, end_sec: 14.4, speaker: 'VO1', text: 'Zero sugar.', tone: 'upbeat' },
      { start_sec: 14.9, end_sec: 17.2, speaker: 'VO1', text: 'Clinically proven focus.', tone: 'confident' },
      { start_sec: 18.6, end_sec: 21.9, speaker: 'VO1', text: 'Daybreak. Light, in a can.', tone: 'warm' },
      { start_sec: 22.6, end_sec: 23.8, speaker: 'VO1', text: 'Shop at daybreak dot example.', tone: 'neutral' },
    ],
  },
  visual: {
    characters: [],
    objects: [
      { id: 'O1', label: 'Daybreak can', canonical_look: 'Coral pink (#FF6F61) 330 ml can, cream label band, sunrise logo', appearances: [{ start_sec: 3.2, description: 'Hero shot on the pedestal, logo to camera' }, { start_sec: 8.0, description: 'Close-up: renders orange, label turned away' }, { start_sec: 18.1, description: 'End card, coral again' }] },
      { id: 'O2', label: 'Pedestal', canonical_look: 'Pale pink cylinder plinth', appearances: [{ start_sec: 3.2, description: 'Under the can in shots 2, 4 and 5' }] },
    ],
    scenes: [
      { start_sec: 0, location: 'Night stage', time_of_day: 'night', lighting: 'cobalt rim light', description: 'Silhouette rises over a cobalt horizon.' },
      { start_sec: 3.2, location: 'Dawn set', time_of_day: 'dawn', lighting: 'soft key, rose fill', description: 'Hero product on a plinth with bubbles.' },
      { start_sec: 8.0, location: 'Dawn set', time_of_day: 'dawn', lighting: 'soft key', description: 'Close-up of the can with benefit lines.' },
      { start_sec: 12.5, location: 'Rose set', time_of_day: 'morning', lighting: 'high key', description: 'Kinetic type over the product.' },
      { start_sec: 18.1, location: 'White set', time_of_day: 'day', lighting: 'high key', description: 'End card with wordmark and call to action.' },
    ],
    on_screen_text: [], visual_quality: { overall: 66 },
    signals: { black_intervals: [{ start: 17.5, end: 18.1 }], freeze_intervals: [], avg_brightness: 142.3, brightness_curve: curve(48, (i, k) => ({ t: k * 24, y: k < 0.13 ? 30 + k * 300 : k > 0.73 && k < 0.755 ? 0 : 120 + k * 90 })) },
  },
  audio: {
    speakers: [{ id: 'VO1', label: 'Narrator', voice_profile: 'Warm female voice, mid-30s, close-mic', on_screen_character: null }],
    emotion_timeline: [], audio_quality: { overall: 72 }, background_music: { present: true, genre: 'synth pop', energy: 'medium' },
    signals: { integrated_lufs: -9.2, loudness_range_lu: 4.1, true_peak_dbtp: -0.3, silences: [], clipping: [], loudness_curve: curve(96, (i, k) => ({ t: k * 24, lufs: -11 + Math.sin(i * 0.7) * 1.5 + (k > 0.73 && k < 0.755 ? -40 : 0) })) },
  },
  text: {
    metadata_alignment: { title_match: 84, description_match: 78, intent_match: 61, audience_match: 70, notes: 'Delivers the product and the launch, but nothing in the spot pushes a pre-order.' },
    script_quality: { overall: 71 }, topic: { summary: 'A launch spot for a yuzu sparkling soda: night-to-day product reveal, three benefit lines and an end card.' },
    keywords: ['yuzu', 'sparkling soda', 'summer launch'], hashtags: ['#yuzu', '#sparklingsoda', '#daybreaksoda'],
  },
  authenticity: { ai_generated_likelihood: 0.88, deepfake_risk: 'low', authenticity_score: 64, notes: 'Rendered product shots with AI text artefacts on the label.' },
  consistency: { metrics: { overall: 41 }, notes: 'Product colour and label orientation break in shot 3.' },
  viral: {
    hook: { strength: 48, first_seconds: 'A dark silhouette rising over a cobalt horizon; the can is only recognisable at 2.8s.' },
    cta: { present: true, text: 'Shop at daybreak.example', start_sec: 22.6 },
    captions_present: false,
    audience_fit: { score: 72, notes: 'Palette and pace suit 18-30; the claim line undercuts trust.' },
    viral_potential: { score: 52, rationale: 'Strong look, slow start, and a horizontal frame on vertical-first platforms.', drivers: ['Distinct dawn palette', 'Satisfying product reveal'], blockers: ['16:9 on TikTok and Reels', 'Hook lands late', 'No captions'] },
    platform_fit: [{ platform: 'tiktok', score: 46, notes: 'Needs a vertical cut and captions.' }, { platform: 'instagram_reels', score: 49, notes: 'Needs a vertical cut.' }, { platform: 'youtube', score: 70, notes: 'Fits as a pre-roll; hook is slow.' }],
    spec_checks: [
      { platform: 'instagram_reels', label: 'Instagram Reels', aspect: '16:9', aspect_ok: false, resolution_ok: true, duration_ok: true, notes: ['16:9 delivered, 9:16 expected'] },
      { platform: 'tiktok', label: 'TikTok', aspect: '16:9', aspect_ok: false, resolution_ok: true, duration_ok: true, notes: ['16:9 delivered, 9:16 expected'] },
      { platform: 'youtube', label: 'YouTube', aspect: '16:9', aspect_ok: true, resolution_ok: true, duration_ok: true, notes: [] },
    ],
    pacing: { shots: [{ start: 0, end: 3.2 }, { start: 3.2, end: 8 }, { start: 8, end: 12.5 }, { start: 12.5, end: 17.5 }, { start: 18.1, end: 24 }], avg_shot_sec: 4.6, cuts_per_min: 12.5, first_cut_sec: 3.2 },
  },
  guardrails: {
    checks: [
      { category: 'content_safety', passed: true, risk_score: 0.02, notes: 'Nothing unsafe.' },
      { category: 'health_claims', passed: false, risk_score: 0.86, notes: 'Unsubstantiated cognitive benefit claim at 0:14.8.' },
      { category: 'disclaimers', passed: false, risk_score: 0.6, notes: 'Asterisk without a disclaimer.' },
      { category: 'brand_safety', passed: true, risk_score: 0.05, notes: 'No competitor marks or unsafe adjacency.' },
      { category: 'ad_disclosure', passed: true, risk_score: 0.1, notes: 'Branded content is evident.' },
    ],
    claims: [
      { claim: 'Clinically proven focus', start_sec: 14.8, risk: 'high', reason: 'Health benefit claim with no substantiation in the brief' },
      { claim: 'Zero sugar', start_sec: 12.8, risk: 'low', reason: 'Matches the product notes' },
    ],
  },
  memory: { recalled: 0, learned: 2 },
  scene_cuts: [0, 3.2, 8, 12.5, 17.5, 18.1],
  thumbnails: thumbs,
  filtered_findings: [], raw_finding_count: 16, suggestion_count: 7,
  timings_ms: { total: 94000 },
};

const sug = (o) => ({ status: 'PENDING_REVIEW', platform: null, description: '', findingIds: [], userFeedback: '', ...o });
export const suggestions = [
  sug({ id: 's_01', type: 'EDIT_SUGGESTION', title: 'Open on the lit can', targetSegment: { startTime: 0, endTime: 3.2 }, expectedImpact: 'HIGH', description: 'Trim the silhouette to 0.8s, or start on the 0:02.8 frame, so the product reads in the first second.', findingIds: ['f_005'] }),
  sug({ id: 's_02', type: 'EDIT_SUGGESTION', title: 'Remove the black gap before the end card', targetSegment: { startTime: 17.5, endTime: 18.1 }, expectedImpact: 'MEDIUM', improvedText: findings[5].fix_command, findingIds: ['f_006'] }),
  sug({ id: 's_03', type: 'SCRIPT_IMPROVEMENT', title: 'Replace the health claim', targetSegment: { startTime: 14.8, endTime: 17.3 }, expectedImpact: 'HIGH', originalText: 'Clinically proven focus.*', improvedText: 'Made with real yuzu peel.', findingIds: ['f_002', 'f_010'] }),
  sug({ id: 's_04', type: 'SCRIPT_IMPROVEMENT', title: 'Say the call to action over the end card', targetSegment: { startTime: 18.6, endTime: 21.9 }, expectedImpact: 'MEDIUM', originalText: 'Daybreak. Light, in a can.', improvedText: 'Daybreak. Light, in a can. Pre-order at daybreak.example.', findingIds: ['f_007'] }),
  sug({ id: 's_05', type: 'VISUAL_ENHANCEMENT', title: 'Match the can in shot 3 to the reference', targetSegment: { startTime: 8, endTime: 12.5 }, expectedImpact: 'HIGH', description: 'Grade the can to #FF6F61 and keep the sunrise logo to camera, as at 0:05.0.', findingIds: ['f_001'] }),
  sug({ id: 's_06', type: 'PLATFORM_OPTIMIZATION', title: 'Cut a 9:16 version for TikTok and Reels', targetSegment: { startTime: 0, endTime: 24 }, expectedImpact: 'HIGH', platform: 'tiktok', description: 'Reframe on the can; it stays centred in every shot, so a centre crop holds with small adjustments in shot 3.', findingIds: ['f_003'] }),
  sug({ id: 's_07', type: 'CREATIVE_IDEA', title: 'Let the light rise with the can', targetSegment: { startTime: 0, endTime: 8 }, expectedImpact: 'LOW', description: 'Brighten the cyclorama from night to dawn as the can rises, so the opening already shows the brand colour.' }),
];
