// data.js — Exercise library + routines. Reusable data model, no hard-coded per-routine logic.
// Exercise types: TIMED_HOLD, TIMED_MOVEMENT, REPETITIONS, LEFT_RIGHT_HOLD, STRENGTH_REPS, BREATHING

const EX = {}; // exercise library keyed by id

function addEx(e) {
  EX[e.id] = Object.assign({
    formCues: [], voiceCues: [], equipment: [], sides: false, duration: null,
    category: 'HEIGHT', instructions: '', shortInstructions: e.name, image: null
  }, e);
}

// ---------- HEIGHT / STRETCH / YOGA LIBRARY ----------
addEx({ id: 'passive_hang', name: 'Passive Dead Hang', type: 'TIMED_HOLD', duration: 20, category: 'HEIGHT',
  equipment: ['bar'], instructions: 'Hang from the bar with arms straight and shoulders relaxed. Let your body hang loosely.',
  shortInstructions: 'Hang loosely, arms straight, shoulders relaxed.',
  formCues: ['Relax your shoulders', 'Let your spine lengthen'], safety: 'Stop if you feel wrist or shoulder pain. Use a step to get down safely.' });

addEx({ id: 'active_hang', name: 'Active-to-Passive Hang', type: 'TIMED_HOLD', duration: 20, category: 'HEIGHT',
  equipment: ['bar'], instructions: 'Engage your shoulders briefly (active hang), then relax fully into a passive hang for the rest of the hold.',
  shortInstructions: 'Engage shoulders briefly, then relax into the hang.',
  formCues: ['Engage, then let go', 'Breathe steadily'] });

addEx({ id: 'cat_cow', name: 'Cat-Cow', type: 'TIMED_MOVEMENT', duration: 40, category: 'HEIGHT',
  instructions: 'On hands and knees, alternate between arching your back (cow) and rounding it (cat) slowly with your breath.',
  shortInstructions: 'Alternate arching and rounding your back slowly.',
  formCues: ['Move with your breath', 'Keep it slow and controlled'] });

addEx({ id: 'cobra', name: 'Cobra Pose', type: 'TIMED_HOLD', duration: 30, category: 'HEIGHT',
  instructions: 'Lie face down, press through your palms and lift your chest, keeping hips on the floor.',
  shortInstructions: 'Lift your chest, hips stay on the floor.',
  formCues: ['Keep shoulders away from ears', 'Do not force the range'] });

addEx({ id: 'sphinx', name: 'Sphinx Pose', type: 'TIMED_HOLD', duration: 45, category: 'HEIGHT',
  instructions: 'Lie face down propped on your forearms, gently lifting your chest for a mild backbend.',
  shortInstructions: 'Prop up on forearms, lift chest gently.',
  formCues: ['Relax your lower back', 'Breathe slowly'] });

addEx({ id: 'up_dog', name: 'Upward-Facing Dog', type: 'TIMED_HOLD', duration: 30, category: 'HEIGHT',
  instructions: 'Press through your hands, straighten your arms and lift your thighs off the floor, opening the chest.',
  shortInstructions: 'Straighten arms, lift thighs, open the chest.',
  formCues: ['Keep shoulders down', 'Stop if lower back pinches'] });

addEx({ id: 'down_dog', name: 'Downward-Facing Dog', type: 'TIMED_HOLD', duration: 45, category: 'HEIGHT',
  instructions: 'Form an inverted V-shape, pressing your heels toward the floor and lengthening your spine.',
  shortInstructions: 'Inverted V, press heels down, lengthen spine.',
  formCues: ['Bend knees if hamstrings are tight', 'Push floor away with your hands'] });

addEx({ id: 'child_pose', name: 'Extended Child\'s Pose', type: 'TIMED_HOLD', duration: 45, category: 'HEIGHT',
  instructions: 'Kneel and sit back onto your heels, reaching your arms forward and relaxing your chest toward the floor.',
  shortInstructions: 'Sit back on heels, reach arms forward, relax.',
  formCues: ['Breathe into your back', 'Let your hips sink'] });

addEx({ id: 'child_side_reach', name: 'Child\'s Pose Side Reach', type: 'LEFT_RIGHT_HOLD', duration: 20, sides: true, category: 'HEIGHT',
  instructions: 'From child\'s pose, walk your hands over to one side to stretch the opposite side of your torso.',
  shortInstructions: 'Walk hands to one side, stretch the torso.',
  formCues: ['Keep hips low', 'Reach, don\'t strain'] });

addEx({ id: 'overhead_reach', name: 'Standing Overhead Reach', type: 'TIMED_HOLD', duration: 30, category: 'HEIGHT',
  instructions: 'Stand tall and reach both arms overhead, lengthening through your sides and spine.',
  shortInstructions: 'Reach both arms overhead, lengthen your spine.',
  formCues: ['Keep breathing', 'Reach up, not shrug up'] });

addEx({ id: 'side_stretch', name: 'Standing Side Stretch', type: 'LEFT_RIGHT_HOLD', duration: 25, sides: true, category: 'HEIGHT',
  instructions: 'Reach one arm overhead and lean gently to the opposite side, feeling a stretch along your torso.',
  shortInstructions: 'Reach overhead, lean to the opposite side.',
  formCues: ['Keep hips stacked', 'Move into a controlled stretch'] });

addEx({ id: 'low_lunge', name: 'Low Lunge / Hip-Flexor Stretch', type: 'LEFT_RIGHT_HOLD', duration: 40, sides: true, category: 'HEIGHT',
  instructions: 'Step one foot forward into a lunge, lower your back knee, and gently push your hips forward.',
  shortInstructions: 'Front foot forward, lower back knee, hips forward.',
  formCues: ['Keep your torso tall', 'Stop at a strong but controlled stretch'] });

addEx({ id: 'half_split', name: 'Half-Split Hamstring Stretch', type: 'LEFT_RIGHT_HOLD', duration: 40, sides: true, category: 'HEIGHT',
  instructions: 'From a lunge, shift your hips back and straighten your front leg, hinging forward over it.',
  shortInstructions: 'Straighten front leg, hinge forward over it.',
  formCues: ['Keep your back flat', 'Don\'t force the range'] });

addEx({ id: 'hamstring_stretch', name: 'Standing/Seated Hamstring Stretch', type: 'TIMED_HOLD', duration: 40, category: 'HEIGHT',
  instructions: 'Extend one or both legs and hinge forward from your hips, keeping your spine long.',
  shortInstructions: 'Hinge forward from the hips, spine long.',
  formCues: ['Bend knees slightly if needed', 'Stop if you feel sharp pain'] });

addEx({ id: 'pigeon', name: 'Pigeon Pose', type: 'LEFT_RIGHT_HOLD', duration: 45, sides: true, category: 'HEIGHT',
  instructions: 'Bring one shin forward at an angle and extend the other leg back, sinking your hips toward the floor.',
  shortInstructions: 'Front shin angled forward, back leg extended.',
  formCues: ['Keep hips square', 'Use a cushion under your hip if needed'] });

addEx({ id: 'hip_9090', name: '90/90 Hip Stretch', type: 'LEFT_RIGHT_HOLD', duration: 40, sides: true, category: 'HEIGHT',
  instructions: 'Sit with both legs bent at 90 degrees, one in front and one to the side, and lean gently forward.',
  shortInstructions: 'Both legs bent at 90°, lean gently forward.',
  formCues: ['Keep your spine long', 'Move slowly'] });

addEx({ id: 'butterfly', name: 'Butterfly Stretch', type: 'TIMED_HOLD', duration: 45, category: 'HEIGHT',
  instructions: 'Sit with the soles of your feet together and let your knees relax toward the floor.',
  shortInstructions: 'Soles of feet together, knees relax down.',
  formCues: ['Sit tall', 'Let gravity do the work'] });

addEx({ id: 'frog', name: 'Frog Stretch', type: 'TIMED_HOLD', duration: 40, category: 'HEIGHT',
  instructions: 'On hands and knees, widen your knees out to the sides and gently rock your hips back.',
  shortInstructions: 'Widen knees, rock hips back gently.',
  formCues: ['Go only as deep as comfortable', 'Breathe slowly'] });

addEx({ id: 'deep_squat', name: 'Deep Squat Hold', type: 'TIMED_HOLD', duration: 40, category: 'HEIGHT',
  instructions: 'Lower into a full squat with feet flat, using your elbows to gently press your knees outward.',
  shortInstructions: 'Full squat, feet flat, elbows press knees out.',
  formCues: ['Keep your heels down', 'Relax into the position'] });

addEx({ id: 'quad_stretch', name: 'Kneeling Quad Stretch', type: 'LEFT_RIGHT_HOLD', duration: 30, sides: true, category: 'HEIGHT',
  instructions: 'From a kneeling lunge, hold your back foot and gently draw the heel toward your glutes.',
  shortInstructions: 'Hold back foot, draw heel toward glutes.',
  formCues: ['Keep hips forward', 'Stop if your knee complains'] });

addEx({ id: 'calf_stretch', name: 'Calf Stretch', type: 'LEFT_RIGHT_HOLD', duration: 30, sides: true, category: 'HEIGHT',
  instructions: 'Step one foot back, keep the heel down and the leg straight, and lean into the wall or forward.',
  shortInstructions: 'Back foot straight, heel down, lean forward.',
  formCues: ['Keep the back knee straight', 'Feel it in the calf, not the knee'] });

addEx({ id: 'thoracic_rotation', name: 'Thoracic Rotation / Open Book', type: 'LEFT_RIGHT_HOLD', duration: 30, sides: true, category: 'HEIGHT',
  instructions: 'Lying on your side with knees bent, open your top arm across your body, rotating through your upper spine.',
  shortInstructions: 'Rotate your top arm open across your body.',
  formCues: ['Keep knees stacked', 'Follow your hand with your eyes'] });

addEx({ id: 'thread_needle', name: 'Thread the Needle', type: 'LEFT_RIGHT_HOLD', duration: 30, sides: true, category: 'HEIGHT',
  instructions: 'On hands and knees, slide one arm under your body, resting your shoulder and ear on the floor.',
  shortInstructions: 'Slide one arm under your body, rest shoulder down.',
  formCues: ['Keep hips level', 'Breathe into your upper back'] });

addEx({ id: 'kneeling_lat', name: 'Kneeling Lat Stretch', type: 'LEFT_RIGHT_HOLD', duration: 30, sides: true, category: 'HEIGHT',
  instructions: 'Kneeling at a raised surface, walk your hands forward and sink your chest down, reaching to one side.',
  shortInstructions: 'Hands on a surface, sink chest, reach to one side.',
  formCues: ['Keep arms straight', 'Sink gently, don\'t bounce'] });

addEx({ id: 'wall_chest', name: 'Wall Chest/Shoulder Stretch', type: 'LEFT_RIGHT_HOLD', duration: 30, sides: true, category: 'HEIGHT',
  instructions: 'Place your forearm on a wall at shoulder height and gently rotate your body away from the wall.',
  shortInstructions: 'Forearm on wall, rotate body away.',
  formCues: ['Keep your shoulder down', 'Move into a controlled stretch'] });

addEx({ id: 'supine_stretch', name: 'Supine Full-Body Stretch', type: 'TIMED_HOLD', duration: 40, category: 'HEIGHT',
  instructions: 'Lie on your back and reach your arms overhead and toes away, lengthening your whole body.',
  shortInstructions: 'Lie down, reach arms overhead and toes away.',
  formCues: ['Lengthen, don\'t strain', 'Breathe fully'] });

addEx({ id: 'deep_breathing', name: 'Deep Breathing', type: 'BREATHING', duration: 90, category: 'HEIGHT',
  instructions: 'Lie or sit comfortably. Breathe in slowly through your nose, and out slowly through your mouth.',
  shortInstructions: 'Slow breathing in through the nose, out through the mouth.',
  formCues: ['Let your body settle', 'There is nowhere else to be right now'] });

// ---------- PUSH LIBRARY ----------
function addStrength(e) { addEx(Object.assign({ type: 'STRENGTH_REPS' }, e)); }

addStrength({ id: 'pushup_standard', name: 'Standard Push-Up', category: 'PUSH',
  instructions: 'Hands under shoulders, body in a straight line, lower your chest to the floor and press back up.',
  shortInstructions: 'Straight body line, lower chest, press up.', formCues: ['Keep your core tight', 'Full range of motion'] });
addStrength({ id: 'pushup_incline', name: 'Incline Push-Up', category: 'PUSH',
  instructions: 'Hands on a raised surface, perform a push-up at an easier angle.',
  shortInstructions: 'Hands elevated, easier angle push-up.', formCues: ['Keep your body straight'] });
addStrength({ id: 'pushup_decline', name: 'Decline Push-Up', category: 'PUSH',
  instructions: 'Feet elevated on a raised surface, perform a push-up at a harder angle.',
  shortInstructions: 'Feet elevated, harder angle push-up.', formCues: ['Keep hips level with shoulders'] });
addStrength({ id: 'pushup_closegrip', name: 'Close-Grip Push-Up', category: 'PUSH',
  instructions: 'Hands close together under your chest, lower down keeping elbows tucked, emphasizing triceps.',
  shortInstructions: 'Hands close together, elbows tucked.', formCues: ['Elbows stay close to your body'] });
addStrength({ id: 'pushup_wide', name: 'Wide Push-Up', category: 'PUSH',
  instructions: 'Hands set wider than shoulders, lower down emphasizing the chest.',
  shortInstructions: 'Hands wide, lower with control.', formCues: ['Keep control on the way down'] });
addStrength({ id: 'pike_pushup', name: 'Pike Push-Up', category: 'PUSH',
  instructions: 'Hips high in an inverted V, lower your head toward the floor to emphasize the shoulders.',
  shortInstructions: 'Hips high, lower head toward floor.', formCues: ['Keep hips high throughout'] });
addStrength({ id: 'plate_ohp', name: 'Plate Overhead Press', category: 'PUSH', equipment: ['plates'],
  instructions: 'Hold a plate at your chest with both hands and press it straight overhead.',
  shortInstructions: 'Press the plate straight overhead.', formCues: ['Grip the plate securely', 'Avoid arching your lower back'] });
addStrength({ id: 'plate_front_raise', name: 'Plate Front Raise', category: 'PUSH', equipment: ['plates'],
  instructions: 'Hold a plate with both hands and raise it in front of you to shoulder height.',
  shortInstructions: 'Raise the plate to shoulder height in front.', formCues: ['Control the descent', 'Use a light plate'] });
addStrength({ id: 'plate_lateral_raise', name: 'Plate Lateral Raise', category: 'PUSH', equipment: ['plates'],
  instructions: 'Hold a light plate in each hand or one with both hands and raise your arms out to the sides to shoulder height.',
  shortInstructions: 'Raise arms out to the sides.', formCues: ['Use a light weight for control', 'Do not shrug your shoulders'] });
addStrength({ id: 'diamond_pushup', name: 'Diamond Push-Up (Triceps)', category: 'PUSH',
  instructions: 'Form a diamond shape with your hands under your chest and lower down, emphasizing triceps.',
  shortInstructions: 'Diamond hand shape, lower with control.', formCues: ['Keep elbows tucked'] });

// ---------- PULL LIBRARY ----------
addStrength({ id: 'pullup', name: 'Pull-Up', category: 'PULL', equipment: ['bar'],
  instructions: 'Hang from the bar with an overhand grip and pull your chin above the bar.',
  shortInstructions: 'Overhand grip, pull chin above the bar.', formCues: ['Avoid excessive swinging'] });
addStrength({ id: 'chinup', name: 'Chin-Up', category: 'PULL', equipment: ['bar'],
  instructions: 'Hang from the bar with an underhand grip and pull your chin above the bar.',
  shortInstructions: 'Underhand grip, pull chin above the bar.', formCues: ['Squeeze at the top'] });
addStrength({ id: 'negative_pullup', name: 'Negative Pull-Up', category: 'PULL', equipment: ['bar'],
  instructions: 'Start with your chin above the bar (jump or step up), then lower yourself down as slowly as possible.',
  shortInstructions: 'Start at the top, lower down slowly.', formCues: ['Aim for a slow, controlled descent'] });
addStrength({ id: 'scapular_pullup', name: 'Scapular Pull-Up', category: 'PULL', equipment: ['bar'],
  instructions: 'Hang from the bar and, without bending your elbows, pull your shoulder blades down and together.',
  shortInstructions: 'Pull shoulder blades down without bending elbows.', formCues: ['Small controlled movement'] });
addStrength({ id: 'dead_hang_strength', name: 'Dead Hang', category: 'PULL', equipment: ['bar'],
  instructions: 'Hang from the bar with arms straight, holding for time to build grip and shoulder strength.',
  shortInstructions: 'Hang from the bar, arms straight.', formCues: ['Keep your shoulders relaxed but active'] });
addStrength({ id: 'plate_row', name: 'Bent-Over Plate Row', category: 'PULL', equipment: ['plates'],
  instructions: 'Hinge forward with a flat back, hold a plate with both hands, and pull it toward your torso.',
  shortInstructions: 'Hinge forward, pull the plate to your torso.', formCues: ['Keep your back flat', 'Squeeze your shoulder blades'] });
addStrength({ id: 'plate_curl', name: 'Plate Curl', category: 'PULL', equipment: ['plates'],
  instructions: 'Hold a plate securely with both hands at the edges and curl it toward your chest.',
  shortInstructions: 'Curl the plate toward your chest.', formCues: ['Grip both edges of the plate firmly', 'Avoid swinging'] });
addStrength({ id: 'ytw_raise', name: 'Prone Y-T-W Raise', category: 'PULL',
  instructions: 'Lying face down, raise your arms into a Y, then a T, then a W shape to target postural muscles.',
  shortInstructions: 'Raise arms through Y, T, and W shapes.', formCues: ['Small controlled range', 'Keep your neck neutral'] });

// ---------- LEGS LIBRARY ----------
addStrength({ id: 'squat_bw', name: 'Bodyweight Squat', category: 'LEGS',
  instructions: 'Feet shoulder-width apart, lower your hips back and down, then stand back up.',
  shortInstructions: 'Lower hips back and down, stand up.', formCues: ['Keep your chest up', 'Knees track over your toes'] });
addStrength({ id: 'squat_plate', name: 'Plate Squat', category: 'LEGS', equipment: ['plates'],
  instructions: 'Hold a plate at your chest and perform a squat with added resistance.',
  shortInstructions: 'Hold the plate at your chest, squat down.', formCues: ['Keep the plate close to your body'] });
addStrength({ id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', category: 'LEGS', sides: true,
  instructions: 'Rear foot elevated on a surface, lower your back knee toward the floor and push back up.',
  shortInstructions: 'Rear foot elevated, lower and push up.', formCues: ['Keep your torso upright'] });
addStrength({ id: 'reverse_lunge', name: 'Reverse Lunge', category: 'LEGS', sides: true,
  instructions: 'Step one foot backward into a lunge, lower your back knee, and step back to standing.',
  shortInstructions: 'Step back into a lunge, return to standing.', formCues: ['Keep your front knee stable'] });
addStrength({ id: 'forward_lunge', name: 'Forward Lunge', category: 'LEGS', sides: true,
  instructions: 'Step one foot forward into a lunge, lower your back knee, and step back to standing.',
  shortInstructions: 'Step forward into a lunge, return to standing.', formCues: ['Control the descent'] });
addStrength({ id: 'plate_rdl', name: 'Plate Romanian Deadlift', category: 'LEGS', equipment: ['plates'],
  instructions: 'Hold a plate with both hands and hinge at your hips, lowering the plate along your legs.',
  shortInstructions: 'Hinge at the hips, lower the plate along your legs.', formCues: ['Keep a flat back', 'Slight bend in the knees'] });
addStrength({ id: 'single_leg_rdl', name: 'Single-Leg Romanian Deadlift', category: 'LEGS', sides: true,
  instructions: 'Balance on one leg and hinge forward, extending the other leg back for counterbalance.',
  shortInstructions: 'Balance on one leg, hinge forward.', formCues: ['Keep your hips square', 'Move slowly for balance'] });
addStrength({ id: 'glute_bridge', name: 'Glute Bridge', category: 'LEGS',
  instructions: 'Lying on your back with knees bent, lift your hips up by squeezing your glutes.',
  shortInstructions: 'Lift hips by squeezing your glutes.', formCues: ['Avoid overarching your lower back'] });
addStrength({ id: 'glute_bridge_weighted', name: 'Weighted Glute Bridge', category: 'LEGS', equipment: ['plates'],
  instructions: 'Perform a glute bridge with a plate resting on your hips for added resistance.',
  shortInstructions: 'Glute bridge with a plate on your hips.', formCues: ['Hold the plate steady'] });
addStrength({ id: 'calf_raise', name: 'Calf Raise', category: 'LEGS',
  instructions: 'Standing tall, rise up onto the balls of your feet and lower back down with control.',
  shortInstructions: 'Rise onto your toes, lower with control.', formCues: ['Full range of motion'] });
addStrength({ id: 'single_calf_raise', name: 'Single-Leg Calf Raise', category: 'LEGS', sides: true,
  instructions: 'Balancing on one leg, rise up onto the ball of your foot and lower back down.',
  shortInstructions: 'Balance on one leg, rise onto your toes.', formCues: ['Use a wall for balance if needed'] });
addStrength({ id: 'wall_sit', name: 'Wall Sit', category: 'LEGS',
  instructions: 'Back against a wall, slide down until your knees are at about 90 degrees and hold.',
  shortInstructions: 'Slide down the wall to a seated hold.', formCues: ['Keep your back flat against the wall'] });

// ---------- CORE LIBRARY ----------
addStrength({ id: 'plank', name: 'Plank', category: 'CORE',
  instructions: 'Forearms on the floor, body in a straight line from head to heels, hold.',
  shortInstructions: 'Forearms down, straight body line, hold.', formCues: ['Don\'t let your hips sag'] });
addStrength({ id: 'side_plank', name: 'Side Plank', category: 'CORE', sides: true,
  instructions: 'Lying on your side, prop up on one forearm and lift your hips into a straight line.',
  shortInstructions: 'Prop on one forearm, lift hips into a line.', formCues: ['Stack your feet or stagger for balance'] });
addStrength({ id: 'dead_bug', name: 'Dead Bug', category: 'CORE',
  instructions: 'Lying on your back, extend opposite arm and leg while keeping your lower back pressed down.',
  shortInstructions: 'Extend opposite arm and leg, back stays flat.', formCues: ['Move slowly and with control'] });
addStrength({ id: 'reverse_crunch', name: 'Reverse Crunch', category: 'CORE',
  instructions: 'Lying on your back, curl your knees toward your chest, lifting your hips slightly off the floor.',
  shortInstructions: 'Curl knees toward chest, lift hips slightly.', formCues: ['Avoid using momentum'] });
addStrength({ id: 'leg_raise', name: 'Leg Raise', category: 'CORE',
  instructions: 'Lying on your back, raise your straight legs toward the ceiling, then lower with control.',
  shortInstructions: 'Raise straight legs, lower with control.', formCues: ['Keep your lower back pressed down'] });
addStrength({ id: 'hanging_knee_raise', name: 'Hanging Knee Raise', category: 'CORE', equipment: ['bar'],
  instructions: 'Hang from the bar and raise your knees toward your chest with control.',
  shortInstructions: 'Hang, raise knees toward your chest.', formCues: ['Avoid swinging'] });
addStrength({ id: 'hollow_hold', name: 'Hollow Body Hold', category: 'CORE',
  instructions: 'Lying on your back, lift your shoulders and legs slightly off the floor, pressing your lower back down.',
  shortInstructions: 'Lift shoulders and legs slightly, hold.', formCues: ['Keep your lower back on the floor'] });
addStrength({ id: 'bird_dog', name: 'Bird Dog', category: 'CORE', sides: true,
  instructions: 'On hands and knees, extend opposite arm and leg while keeping your hips level.',
  shortInstructions: 'Extend opposite arm and leg, hips level.', formCues: ['Move slowly, avoid rotating your hips'] });

// ================= ROUTINE BUILDER HELPERS =================
// exercise instance: { exerciseId, sets, reps(optional target), duration(override), restDuration, transitionDuration }
function inst(exerciseId, opts = {}) {
  return Object.assign({ exerciseId, sets: 1, restDuration: 20, transitionDuration: 12 }, opts);
}
function strengthInst(exerciseId, opts = {}) {
  return Object.assign({ exerciseId, sets: 3, targetReps: 10, restDuration: 60, transitionDuration: 10 }, opts);
}

const ROUTINES = {};
function addRoutine(r) { ROUTINES[r.id] = r; }

// ---------- MORNING HEIGHT ROUTINES (A/B/C rotation, ~30 min) ----------
addRoutine({
  id: 'height_a', name: 'Height A — Spine & Decompression', category: 'HEIGHT', estimatedDuration: 30,
  exercises: [
    inst('passive_hang', { sets: 3, duration: 20, restDuration: 30, transitionDuration: 15 }),
    inst('cat_cow', { duration: 40 }),
    inst('cobra', { duration: 30 }),
    inst('sphinx', { duration: 45 }),
    inst('thoracic_rotation', { duration: 30 }),
    inst('thread_needle', { duration: 30 }),
    inst('kneeling_lat', { duration: 30 }),
    inst('wall_chest', { duration: 30 }),
    inst('overhead_reach', { duration: 30 }),
    inst('down_dog', { duration: 45 }),
    inst('child_pose', { duration: 45 }),
    inst('active_hang', { sets: 2, duration: 20, restDuration: 20, transitionDuration: 15 }),
    inst('supine_stretch', { duration: 45 }),
  ]
});

addRoutine({
  id: 'height_b', name: 'Height B — Hips & Lower Body', category: 'HEIGHT', estimatedDuration: 30,
  exercises: [
    inst('low_lunge', { duration: 40 }),
    inst('half_split', { duration: 40 }),
    inst('pigeon', { duration: 45 }),
    inst('hip_9090', { duration: 40 }),
    inst('butterfly', { duration: 45 }),
    inst('frog', { duration: 40 }),
    inst('deep_squat', { duration: 40 }),
    inst('quad_stretch', { duration: 30 }),
    inst('calf_stretch', { duration: 30 }),
    inst('hamstring_stretch', { duration: 40 }),
    inst('passive_hang', { sets: 2, duration: 20, restDuration: 25, transitionDuration: 15 }),
    inst('supine_stretch', { duration: 45 }),
  ]
});

addRoutine({
  id: 'height_c', name: 'Height C — Full-Body Yoga', category: 'HEIGHT', estimatedDuration: 30,
  exercises: [
    inst('down_dog', { duration: 40 }),
    inst('cobra', { duration: 30 }),
    inst('child_pose', { duration: 30 }),
    inst('low_lunge', { duration: 35 }),
    inst('pigeon', { duration: 40 }),
    inst('thoracic_rotation', { duration: 30 }),
    inst('overhead_reach', { duration: 30 }),
    inst('passive_hang', { sets: 2, duration: 20, restDuration: 25, transitionDuration: 15 }),
    inst('cat_cow', { duration: 30 }),
    inst('butterfly', { duration: 40 }),
    inst('side_stretch', { duration: 25 }),
    inst('supine_stretch', { duration: 45 }),
  ]
});

// ---------- EVENING HEIGHT/YOGA (~20 min, distinct from morning) ----------
addRoutine({
  id: 'evening_yoga_1', name: 'Evening Yoga — Posture & Shoulders', category: 'EVENING_YOGA', estimatedDuration: 20,
  exercises: [
    inst('cat_cow', { duration: 30 }),
    inst('wall_chest', { duration: 30 }),
    inst('kneeling_lat', { duration: 30 }),
    inst('thread_needle', { duration: 30 }),
    inst('child_pose', { duration: 40 }),
    inst('low_lunge', { duration: 30 }),
    inst('side_stretch', { duration: 25 }),
    inst('supine_stretch', { duration: 40 }),
  ]
});

addRoutine({
  id: 'evening_yoga_2', name: 'Evening Yoga — Hips & Decompression', category: 'EVENING_YOGA', estimatedDuration: 20,
  exercises: [
    inst('pigeon', { duration: 35 }),
    inst('hip_9090', { duration: 30 }),
    inst('butterfly', { duration: 35 }),
    inst('deep_squat', { duration: 30 }),
    inst('thoracic_rotation', { duration: 25 }),
    inst('passive_hang', { sets: 2, duration: 15, restDuration: 20, transitionDuration: 12 }),
    inst('supine_stretch', { duration: 40 }),
  ]
});

addRoutine({
  id: 'evening_yoga_3', name: 'Evening Yoga — Full Body Wind-Down', category: 'EVENING_YOGA', estimatedDuration: 20,
  exercises: [
    inst('cobra', { duration: 25 }),
    inst('down_dog', { duration: 30 }),
    inst('half_split', { duration: 30 }),
    inst('quad_stretch', { duration: 25 }),
    inst('calf_stretch', { duration: 25 }),
    inst('child_pose', { duration: 40 }),
    inst('supine_stretch', { duration: 45 }),
  ]
});

// ---------- NIGHT RECOVERY (~10 min, gentle) ----------
addRoutine({
  id: 'night_recovery', name: 'Night Recovery', category: 'NIGHT', estimatedDuration: 10,
  exercises: [
    inst('child_pose', { duration: 60, transitionDuration: 10 }),
    inst('hip_9090', { duration: 35, transitionDuration: 10 }),
    inst('hamstring_stretch', { duration: 40, transitionDuration: 10 }),
    inst('butterfly', { duration: 40, transitionDuration: 10 }),
    inst('cat_cow', { duration: 30, transitionDuration: 10 }),
    inst('deep_breathing', { duration: 90, transitionDuration: 10 }),
  ]
});

// ---------- PUSH ----------
addRoutine({
  id: 'push_a', name: 'Push A', category: 'PUSH', estimatedDuration: 30,
  exercises: [
    strengthInst('pushup_standard', { sets: 3, targetReps: 10 }),
    strengthInst('pike_pushup', { sets: 3, targetReps: 8 }),
    strengthInst('plate_ohp', { sets: 3, targetReps: 10 }),
    strengthInst('pushup_closegrip', { sets: 3, targetReps: 8 }),
    inst('plank', { sets: 3, duration: 30, restDuration: 30, transitionDuration: 10 }),
  ]
});
addRoutine({
  id: 'push_b', name: 'Push B', category: 'PUSH', estimatedDuration: 30,
  exercises: [
    strengthInst('pushup_incline', { sets: 3, targetReps: 12 }),
    strengthInst('pushup_wide', { sets: 3, targetReps: 10 }),
    strengthInst('plate_front_raise', { sets: 3, targetReps: 10 }),
    strengthInst('diamond_pushup', { sets: 3, targetReps: 8 }),
    inst('hollow_hold', { sets: 3, duration: 25, restDuration: 30, transitionDuration: 10 }),
  ]
});

// ---------- PULL ----------
addRoutine({
  id: 'pull_a', name: 'Pull A', category: 'PULL', estimatedDuration: 30,
  exercises: [
    strengthInst('pullup', { sets: 3, targetReps: 3 }),
    strengthInst('plate_row', { sets: 3, targetReps: 10 }),
    strengthInst('scapular_pullup', { sets: 2, targetReps: 8 }),
    strengthInst('plate_curl', { sets: 3, targetReps: 10 }),
    inst('hanging_knee_raise', { sets: 3, restDuration: 30, transitionDuration: 10, useReps: true, targetReps: 8 }),
  ]
});
addRoutine({
  id: 'pull_b', name: 'Pull B', category: 'PULL', estimatedDuration: 30,
  exercises: [
    strengthInst('chinup', { sets: 3, targetReps: 3 }),
    strengthInst('negative_pullup', { sets: 3, targetReps: 3 }),
    strengthInst('dead_hang_strength', { sets: 3, targetReps: 0, duration: 25 }),
    strengthInst('ytw_raise', { sets: 3, targetReps: 10 }),
    inst('bird_dog', { sets: 3, duration: 30, restDuration: 25, transitionDuration: 10 }),
  ]
});

// ---------- LEGS ----------
addRoutine({
  id: 'legs_a', name: 'Legs A', category: 'LEGS', estimatedDuration: 30,
  exercises: [
    strengthInst('squat_bw', { sets: 3, targetReps: 15 }),
    strengthInst('bulgarian_split_squat', { sets: 3, targetReps: 8 }),
    strengthInst('plate_rdl', { sets: 3, targetReps: 10 }),
    strengthInst('calf_raise', { sets: 3, targetReps: 15 }),
    inst('dead_bug', { sets: 3, duration: 30, restDuration: 25, transitionDuration: 10 }),
  ]
});
addRoutine({
  id: 'legs_b', name: 'Legs B', category: 'LEGS', estimatedDuration: 30,
  exercises: [
    strengthInst('squat_plate', { sets: 3, targetReps: 10 }),
    strengthInst('reverse_lunge', { sets: 3, targetReps: 8 }),
    strengthInst('single_leg_rdl', { sets: 3, targetReps: 8 }),
    strengthInst('glute_bridge', { sets: 3, targetReps: 15 }),
    strengthInst('single_calf_raise', { sets: 3, targetReps: 12 }),
    inst('side_plank', { sets: 2, duration: 25, restDuration: 25, transitionDuration: 10 }),
  ]
});

window.EX = EX;
window.ROUTINES = ROUTINES;

// Sprint/walk is not exercise-library based, tracked as a simple daily card.
window.SPRINT_WALK_SCHEDULE = ['Sprint', 'Walk']; // alternates by day-of-experiment
window.STRENGTH_SCHEDULE_DEFAULT = { 0: 'REST', 1: 'PUSH', 2: 'PULL', 3: 'LEGS', 4: 'PUSH', 5: 'PULL', 6: 'LEGS' };
// day index: 0=Sunday ... 6=Saturday (matches Date.getDay())
window.HEIGHT_ROUTINE_ORDER = ['height_a', 'height_b', 'height_c'];
window.EVENING_YOGA_ORDER = ['evening_yoga_1', 'evening_yoga_2', 'evening_yoga_3'];
window.PUSH_VARIANTS = ['push_a', 'push_b'];
window.PULL_VARIANTS = ['pull_a', 'pull_b'];
window.LEGS_VARIANTS = ['legs_a', 'legs_b'];
