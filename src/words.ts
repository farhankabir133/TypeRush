/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WordCategory } from './types';

export const WORD_BANKS: Record<WordCategory, string[]> = {
  common: [
    'about', 'above', 'act', 'active', 'actor', 'after', 'again', 'against', 'agent', 'agree',
    'alarm', 'alive', 'allow', 'alone', 'along', 'alter', 'always', 'among', 'anchor', 'angel',
    'angle', 'angry', 'animal', 'answer', 'apart', 'appeal', 'apple', 'area', 'argue', 'arm',
    'army', 'around', 'arrow', 'artist', 'aspect', 'asset', 'assist', 'assume', 'atom', 'attack',
    'audio', 'audit', 'author', 'avatar', 'awake', 'award', 'aware', 'away', 'axis', 'baby',
    'back', 'backup', 'badge', 'baffle', 'bag', 'bake', 'balance', 'ball', 'band', 'bang',
    'bank', 'banner', 'bare', 'bark', 'barrel', 'base', 'basic', 'basin', 'basis', 'basket',
    'batch', 'bath', 'battle', 'beach', 'beacon', 'beam', 'bean', 'bear', 'beast', 'beat',
    'beauty', 'become', 'bed', 'before', 'beg', 'begin', 'behalf', 'behind', 'behold', 'belief',
    'bell', 'belly', 'belong', 'below', 'belt', 'bench', 'bend', 'benefit', 'berry', 'beside',
    'best', 'bet', 'better', 'beyond', 'bias', 'bible', 'bid', 'big', 'bike', 'bill',
    'binary', 'bind', 'biography', 'bird', 'birth', 'biscuit', 'bit', 'bite', 'bitter', 'blade',
    'blame', 'blank', 'blast', 'blaze', 'bleed', 'blend', 'bless', 'blind', 'blink', 'block',
    'bloke', 'blood', 'bloom', 'blossom', 'blow', 'blue', 'blur', 'blush', 'board', 'boast',
    'boat', 'body', 'boil', 'bold', 'bolt', 'bomb', 'bond', 'bone', 'bonus', 'book',
    'boom', 'boost', 'boot', 'border', 'bore', 'borrow', 'boss', 'botany', 'both', 'bottle',
    'bottom', 'bound', 'boutique', 'bow', 'bowl', 'box', 'boy', 'brace', 'brain', 'brake'
  ],
  tech: [
    'algorithm', 'applet', 'asynchronous', 'bandwidth', 'binary', 'bitrate', 'blockchain', 'boolean',
    'bootstrap', 'buffer', 'bytecode', 'cache', 'ciphertext', 'client', 'cloning', 'cloud',
    'compiler', 'component', 'compression', 'concatenation', 'container', 'crawler', 'cryptography',
    'cybersecurity', 'daemon', 'dashboard', 'database', 'debugger', 'decryption', 'dependency',
    'deployment', 'deprecation', 'developer', 'endpoint', 'encryption', 'ethernet', 'exception',
    'executable', 'fallback', 'firewall', 'firmware', 'framework', 'frontend', 'gateway', 'git',
    'hardware', 'hashrate', 'headers', 'hyperlink', 'hypertext', 'immutable', 'indexing', 'infinite',
    'inheritance', 'initialize', 'interface', 'interpreter', 'intranet', 'iteration', 'javascript',
    'kernel', 'latency', 'library', 'linux', 'metadata', 'microservice', 'middleware', 'modem',
    'multithreading', 'namespace', 'network', 'node', 'nullpointer', 'oauth', 'obsolescence',
    'offline', 'optimize', 'overflow', 'packet', 'parameters', 'parsing', 'payload', 'pipeline',
    'polymorphism', 'protocol', 'prototype', 'recursion', 'refactoring', 'registry', 'repository',
    'resolver', 'responsive', 'runtime', 'sandbox', 'scalability', 'schema', 'scripting', 'sdk',
    'server', 'serialization', 'singleton', 'socket', 'software', 'source', 'sql', 'stack',
    'storage', 'stream', 'subnet', 'synchronous', 'syntax', 'terminal', 'thread', 'token',
    'topology', 'typescript', 'unix', 'validator', 'variable', 'virtual', 'vpn', 'vulnerability',
    'webhook', 'websocket', 'widget', 'xml', 'yaml', 'zip'
  ],
  cinematic: [
    'abyss', 'afterglow', 'ambience', 'anomaly', 'apocalypse', 'ascent', 'asteroid', 'astral',
    'atmosphere', 'aurora', 'blackout', 'borealis', 'cascade', 'celestial', 'chaos', 'chronicle',
    'cinema', 'coda', 'collapse', 'comet', 'constellation', 'corridor', 'cosmic', 'crescent',
    'darkness', 'debris', 'decay', 'delirium', 'depth', 'desolation', 'destiny', 'deviation',
    'dimensions', 'discharge', 'distortion', 'divergence', 'dominion', 'dreamscape', 'drift',
    'duration', 'dusk', 'echoes', 'eclipse', 'effervescence', 'eerie', 'elemental', 'elevation',
    'ember', 'empathy', 'enigma', 'entropy', 'ephemeral', 'epitaph', 'equilibrium', 'essence',
    'eternity', 'evacuation', 'extinction', 'fade', 'firefly', 'fission', 'flare', 'fluctuation',
    'fluidity', 'frequency', 'fusion', 'galaxy', 'ghostly', 'glimmer', 'gloom', 'glow',
    'gravity', 'halcyon', 'halo', 'harmony', 'haven', 'haze', 'horizon', 'hybrid',
    'hyperdrive', 'hyperspace', 'illusion', 'illumination', 'immersion', 'immortality', 'impact',
    'incandescence', 'inertia', 'infinitum', 'infinity', 'interference', 'interstellar', 'interval',
    'invasion', 'ionosphere', 'isolation', 'kaleidoscope', 'labyrinth', 'legacy', 'liminal',
    'luminescence', 'luminous', 'lunar', 'lustre', 'magnetic', 'manifest', 'matrix', 'melancholy',
    'meridian', 'metamorphosis', 'mirage', 'monochrome', 'monolith', 'motion', 'nebula', 'neon',
    'neutral', 'nightfall', 'nirvana', 'nocturnal', 'nostalgia', 'nova', 'oblivion', 'odyssey',
    'omega', 'orbit', 'oscillation', 'overdrive', 'overlay', 'ozone', 'paradox', 'parallax',
    'particles', 'passage', 'phantom', 'phase', 'phenomenon', 'photon', 'pioneer', 'plasma',
    'polaris', 'portals', 'prologue', 'pulsar', 'pulse', 'quantum', 'radiance', 'rebellion',
    'reflection', 'relic', 'resonance', 'retrograde', 'revelation', 'reverie', 'rift', 'ripple',
    'satellite', 'scintillation', 'scythe', 'serenade', 'shadows', 'shimmer', 'silhouette',
    'singularity', 'solace', 'solitude', 'spectrum', 'spectre', 'spin', 'stardust', 'starlight',
    'stratosphere', 'sublime', 'supernova', 'surrender', 'suspension', 'symmetry', 'symphony',
    'synapse', 'telepathy', 'temporal', 'terminus', 'tether', 'threshold', 'timelapse', 'trajectory',
    'transcend', 'transition', 'twilight', 'vacuum', 'vapor', 'velocity', 'vessel', 'vibration',
    'vortex', 'voyage', 'wavelength', 'whisper', 'zenith', 'zero', 'zodiac'
  ],
  chaos: [
    '#define', '3.14159', 'const_cast', 'deadlock', 'double_down', 'eval()', 'fizzbuzz', 'g1t_g00d',
    'h4ck_th3_p14n3t', 'int_main()', 'malloc(0)', 'node_modules', 'nullpointer', 'out_of_bound',
    'overdrive', 'payload()', 'reboot_sys', 'stack_overflow', 'systemctl', 'u_v_w_x_y_z',
    'undefined_behavior', 'vector<int>', 'volatile_mem', 'wifi_disconnect', 'x%y==0', 'zero_day',
    '{_class_}', '[[nodiscard]]', '__proto__', '_destroy_all', 'alloc_failed', 'buffer_attack',
    'can_t_touch_this', 'dark_web_tunnel', 'dangling_pointer', 'error_404', 'fork_bomb_()',
    'glitch_matrix', 'hex_0x7ffe3a', 'infinite_loop', 'jwt_bypass', 'kernel_panic', 'loop_unroll',
    'mutex_lock', 'nan_not_a_number', 'object_assign', 'panic_attack', 'quick_sort', 'random_seed',
    'shellcode_inject', 'try_catch_finally', 'unreachable_code', 'value_undefined', 'webgl_context'
  ]
};

export function getRandomWord(category: WordCategory): string {
  const bank = WORD_BANKS[category];
  const index = Math.floor(Math.random() * bank.length);
  return bank[index];
}
