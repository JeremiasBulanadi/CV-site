
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\Tab.svelte generated by Svelte v3.44.2 */

    const file$7 = "src\\components\\Tab.svelte";

    function create_fragment$7(ctx) {
    	let a;
    	let div1;
    	let div0;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			div1 = element("div");
    			div0 = element("div");
    			t = text(/*tabName*/ ctx[0]);
    			attr_dev(div0, "class", "px-2 mx-auto text-gray-700");
    			add_location(div0, file$7, 7, 8, 165);
    			attr_dev(div1, "class", "tab flex items-center svelte-p61lxo");
    			add_location(div1, file$7, 6, 4, 120);
    			attr_dev(a, "href", a_href_value = "#" + /*tabName*/ ctx[0]);
    			attr_dev(a, "class", "flex text-robot font-semibold svelte-p61lxo");
    			add_location(a, file$7, 5, 0, 55);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tabName*/ 1) set_data_dev(t, /*tabName*/ ctx[0]);

    			if (dirty & /*tabName*/ 1 && a_href_value !== (a_href_value = "#" + /*tabName*/ ctx[0])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Tab', slots, []);
    	let { tabName = "" } = $$props;
    	const writable_props = ['tabName'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('tabName' in $$props) $$invalidate(0, tabName = $$props.tabName);
    	};

    	$$self.$capture_state = () => ({ tabName });

    	$$self.$inject_state = $$props => {
    		if ('tabName' in $$props) $$invalidate(0, tabName = $$props.tabName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tabName];
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { tabName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get tabName() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabName(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Logo.svelte generated by Svelte v3.44.2 */

    const file$6 = "src\\components\\Logo.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let span0;
    	let t1;
    	let div0;
    	let t2;
    	let span1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "JDB";
    			t1 = space();
    			div0 = element("div");
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "developer";
    			attr_dev(span0, "id", "JDB");
    			attr_dev(span0, "class", "font-roboto font-extrabold text-4xl");
    			add_location(span0, file$6, 5, 1, 64);
    			attr_dev(div0, "id", "dot");
    			attr_dev(div0, "class", "svelte-jlw4i2");
    			add_location(div0, file$6, 6, 1, 136);
    			attr_dev(span1, "id", "dev");
    			attr_dev(span1, "class", "font-lato font-semibold");
    			add_location(span1, file$6, 7, 1, 159);
    			attr_dev(div1, "class", "flex mx-8 items-center svelte-jlw4i2");
    			add_location(div1, file$6, 4, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Logo', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Logo> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Logo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Logo",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\Navbar.svelte generated by Svelte v3.44.2 */

    const { console: console_1 } = globals;
    const file$5 = "src\\components\\Navbar.svelte";

    function create_fragment$5(ctx) {
    	let scrolling = false;

    	let clear_scrolling = () => {
    		scrolling = false;
    	};

    	let scrolling_timeout;
    	let header;
    	let nav;
    	let div5;
    	let div1;
    	let div0;
    	let logo;
    	let t0;
    	let div4;
    	let div2;
    	let tab0;
    	let t1;
    	let tab1;
    	let t2;
    	let tab2;
    	let t3;
    	let div3;
    	let a;
    	let button;
    	let nav_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowscroll*/ ctx[6]);
    	logo = new Logo({ $$inline: true });

    	tab0 = new Tab({
    			props: { tabName: "Intro" },
    			$$inline: true
    		});

    	tab1 = new Tab({
    			props: { tabName: "About" },
    			$$inline: true
    		});

    	tab2 = new Tab({
    			props: { tabName: "Contact" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			nav = element("nav");
    			div5 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(logo.$$.fragment);
    			t0 = space();
    			div4 = element("div");
    			div2 = element("div");
    			create_component(tab0.$$.fragment);
    			t1 = space();
    			create_component(tab1.$$.fragment);
    			t2 = space();
    			create_component(tab2.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			a = element("a");
    			button = element("button");
    			button.textContent = "Resume";
    			attr_dev(div0, "class", "logo-container");
    			add_location(div0, file$5, 56, 16, 1588);
    			attr_dev(div1, "class", "nav-side flex");
    			add_location(div1, file$5, 55, 12, 1543);
    			attr_dev(div2, "class", "tabs-container flex");
    			add_location(div2, file$5, 61, 16, 1774);
    			attr_dev(button, "class", "bg-transparent hover:bg-indigo-500 text-indigo-700 font-semibold hover:text-white py-2 px-4 border border-indigo-500 hover:border-transparent rounded transition");
    			add_location(button, file$5, 68, 24, 2132);
    			attr_dev(a, "href", "./JeremiasBulanadi-Resume.pdf");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$5, 67, 20, 2050);
    			attr_dev(div3, "class", "flex items-center px-6");
    			add_location(div3, file$5, 66, 16, 1992);
    			attr_dev(div4, "class", "nav-side hidden md:flex items-stretch ");
    			add_location(div4, file$5, 60, 12, 1704);
    			attr_dev(div5, "id", "nav-content");
    			attr_dev(div5, "class", "flex justify-between svelte-1nup1gs");
    			add_location(div5, file$5, 54, 8, 1478);
    			attr_dev(nav, "id", "navbar");
    			attr_dev(nav, "class", nav_class_value = "bg-gray-200 bg-opacity-80 fixed top-0 left-0 z-50 " + /*headerClass*/ ctx[1] + " svelte-1nup1gs");
    			add_location(nav, file$5, 53, 4, 1353);
    			attr_dev(header, "class", "svelte-1nup1gs");
    			add_location(header, file$5, 52, 0, 1339);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, nav);
    			append_dev(nav, div5);
    			append_dev(div5, div1);
    			append_dev(div1, div0);
    			mount_component(logo, div0, null);
    			append_dev(div5, t0);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			mount_component(tab0, div2, null);
    			append_dev(div2, t1);
    			mount_component(tab1, div2, null);
    			append_dev(div2, t2);
    			mount_component(tab2, div2, null);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, a);
    			append_dev(a, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "scroll", () => {
    						scrolling = true;
    						clearTimeout(scrolling_timeout);
    						scrolling_timeout = setTimeout(clear_scrolling, 100);
    						/*onwindowscroll*/ ctx[6]();
    					}),
    					action_destroyer(/*setTransitionDuration*/ ctx[2].call(null, nav))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*y*/ 1 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window.pageXOffset, /*y*/ ctx[0]);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			if (!current || dirty & /*headerClass*/ 2 && nav_class_value !== (nav_class_value = "bg-gray-200 bg-opacity-80 fixed top-0 left-0 z-50 " + /*headerClass*/ ctx[1] + " svelte-1nup1gs")) {
    				attr_dev(nav, "class", nav_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logo.$$.fragment, local);
    			transition_in(tab0.$$.fragment, local);
    			transition_in(tab1.$$.fragment, local);
    			transition_in(tab2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logo.$$.fragment, local);
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(tab2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(logo);
    			destroy_component(tab0);
    			destroy_component(tab1);
    			destroy_component(tab2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	let { duration = "300ms" } = $$props;
    	let { offset = 10 } = $$props;
    	let { tolerance = 0 } = $$props;
    	let headerClass = "show";
    	let y = 0;
    	let lastY = 0;

    	function deriveClass(y, dy) {
    		// show if at the top of page
    		if (y < offset) {
    			console.log("We docked now, we must **SHOW**");
    			return "docked";
    		}

    		// don't change the state unless scroll delta
    		// is above a threshold 
    		if (Math.abs(dy) <= tolerance) {
    			return headerClass;
    		}

    		// if scrolling up, show
    		if (dy > 0) {
    			return "show";
    		}

    		// if scrolling down, hide
    		return "hide";
    	}

    	function updateClass(y) {
    		const dy = lastY - y;
    		console.table(lastY, y, dy);
    		lastY = y;
    		return deriveClass(y, dy);
    	}

    	function setTransitionDuration(node) {
    		node.style.transitionDuration = duration;
    	}

    	const writable_props = ['duration', 'offset', 'tolerance'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	function onwindowscroll() {
    		$$invalidate(0, y = window.pageYOffset);
    	}

    	$$self.$$set = $$props => {
    		if ('duration' in $$props) $$invalidate(3, duration = $$props.duration);
    		if ('offset' in $$props) $$invalidate(4, offset = $$props.offset);
    		if ('tolerance' in $$props) $$invalidate(5, tolerance = $$props.tolerance);
    	};

    	$$self.$capture_state = () => ({
    		Tab,
    		Logo,
    		duration,
    		offset,
    		tolerance,
    		headerClass,
    		y,
    		lastY,
    		deriveClass,
    		updateClass,
    		setTransitionDuration
    	});

    	$$self.$inject_state = $$props => {
    		if ('duration' in $$props) $$invalidate(3, duration = $$props.duration);
    		if ('offset' in $$props) $$invalidate(4, offset = $$props.offset);
    		if ('tolerance' in $$props) $$invalidate(5, tolerance = $$props.tolerance);
    		if ('headerClass' in $$props) $$invalidate(1, headerClass = $$props.headerClass);
    		if ('y' in $$props) $$invalidate(0, y = $$props.y);
    		if ('lastY' in $$props) lastY = $$props.lastY;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*y*/ 1) {
    			$$invalidate(1, headerClass = updateClass(y));
    		}
    	};

    	return [
    		y,
    		headerClass,
    		setTransitionDuration,
    		duration,
    		offset,
    		tolerance,
    		onwindowscroll
    	];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { duration: 3, offset: 4, tolerance: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get duration() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offset() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offset(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tolerance() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tolerance(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Intro.svelte generated by Svelte v3.44.2 */

    const file$4 = "src\\components\\Intro.svelte";

    function create_fragment$4(ctx) {
    	let section;
    	let h3;
    	let t1;
    	let h10;
    	let t3;
    	let h11;
    	let t5;
    	let div0;
    	let p;
    	let t7;
    	let div1;
    	let a;
    	let button;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h3 = element("h3");
    			h3.textContent = "Hello, my name is";
    			t1 = space();
    			h10 = element("h1");
    			h10.textContent = "Jeremias Bulanadi.";
    			t3 = space();
    			h11 = element("h1");
    			h11.textContent = "I like building things.";
    			t5 = space();
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "I'm a soon to be computer science graduate. I have a passion\r\n            for creative and rewarding work and I am also currently looking\r\n            for jobs that can be an outlet.";
    			t7 = space();
    			div1 = element("div");
    			a = element("a");
    			button = element("button");
    			button.textContent = "> Download my resume";
    			attr_dev(h3, "class", "font-readex text-2xl");
    			add_location(h3, file$4, 5, 4, 101);
    			attr_dev(h10, "class", "font-lato font-extrabold text-indigo-500 hover:text-indigo-600 transition svelte-1ysctf2");
    			add_location(h10, file$4, 6, 4, 162);
    			attr_dev(h11, "class", "font-roboto font-bold text-gray-600 hover:text-gray-700 transition svelte-1ysctf2");
    			add_location(h11, file$4, 7, 4, 277);
    			attr_dev(p, "class", "font-roboto text-lg svelte-1ysctf2");
    			add_location(p, file$4, 9, 8, 425);
    			attr_dev(div0, "class", "p-container svelte-1ysctf2");
    			add_location(div0, file$4, 8, 4, 390);
    			attr_dev(button, "class", "bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 border border-gray-400 rounded shadow transition");
    			add_location(button, file$4, 18, 12, 800);
    			attr_dev(a, "href", "./JeremiasBulanadi-Resume.pdf");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$4, 17, 8, 730);
    			attr_dev(div1, "class", "button-container svelte-1ysctf2");
    			add_location(div1, file$4, 16, 4, 690);
    			attr_dev(section, "id", "Intro");
    			attr_dev(section, "class", "flex flex-col justify-center py-4 sm:py-4 svelte-1ysctf2");
    			add_location(section, file$4, 4, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h3);
    			append_dev(section, t1);
    			append_dev(section, h10);
    			append_dev(section, t3);
    			append_dev(section, h11);
    			append_dev(section, t5);
    			append_dev(section, div0);
    			append_dev(div0, p);
    			append_dev(section, t7);
    			append_dev(section, div1);
    			append_dev(div1, a);
    			append_dev(a, button);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Intro', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Intro> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Intro extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Intro",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\About.svelte generated by Svelte v3.44.2 */

    const file$3 = "src\\components\\About.svelte";

    function create_fragment$3(ctx) {
    	let section;
    	let div0;
    	let h2;
    	let t1;
    	let div3;
    	let article;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let ul;
    	let li0;
    	let t9;
    	let li1;
    	let t11;
    	let li2;
    	let t13;
    	let li3;
    	let t15;
    	let li4;
    	let t17;
    	let li5;
    	let t19;
    	let li6;
    	let t21;
    	let li7;
    	let t23;
    	let li8;
    	let t25;
    	let div2;
    	let div1;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Who Am I";
    			t1 = space();
    			div3 = element("div");
    			article = element("article");
    			p0 = element("p");
    			p0.textContent = "Hi! I'm Jeremias Bulanadi, although most people call me Jay.\r\n                I've been playing with computers since 2002. As a lot of my\r\n                interests revolved around technology, I took up coding as a\r\n                hobby ; And then soon thereafter, a possible career.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "I've also taken an inspiration for arts and design eversince\r\n                I was exposed to video games and animated shows. Now anytime\r\n                I make anything, I've always had the urge to flair things up.";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "My recent escapades involved the use and learning of:";
    			t7 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Javascript";
    			t9 = space();
    			li1 = element("li");
    			li1.textContent = "Typescript";
    			t11 = space();
    			li2 = element("li");
    			li2.textContent = "Node.js";
    			t13 = space();
    			li3 = element("li");
    			li3.textContent = "Svelte";
    			t15 = space();
    			li4 = element("li");
    			li4.textContent = "Vue.js";
    			t17 = space();
    			li5 = element("li");
    			li5.textContent = "React";
    			t19 = space();
    			li6 = element("li");
    			li6.textContent = "Unity";
    			t21 = space();
    			li7 = element("li");
    			li7.textContent = "C#";
    			t23 = space();
    			li8 = element("li");
    			li8.textContent = "Godot";
    			t25 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div1.textContent = "Picture TBA";
    			attr_dev(h2, "class", "font-roboto font-extrabold text-3xl svelte-of1b79");
    			add_location(h2, file$3, 6, 8, 163);
    			attr_dev(div0, "class", "section-header flex flex-row items-center py-4 svelte-of1b79");
    			add_location(div0, file$3, 5, 4, 93);
    			attr_dev(p0, "class", "font-roboto mb-3 svelte-of1b79");
    			add_location(p0, file$3, 10, 12, 389);
    			attr_dev(p1, "class", "font-roboto mb-3 svelte-of1b79");
    			add_location(p1, file$3, 16, 12, 751);
    			attr_dev(p2, "class", "font-roboto svelte-of1b79");
    			add_location(p2, file$3, 21, 12, 1047);
    			add_location(li0, file$3, 25, 16, 1233);
    			add_location(li1, file$3, 28, 16, 1310);
    			add_location(li2, file$3, 31, 16, 1387);
    			add_location(li3, file$3, 34, 16, 1461);
    			add_location(li4, file$3, 37, 16, 1534);
    			add_location(li5, file$3, 40, 16, 1607);
    			add_location(li6, file$3, 43, 16, 1679);
    			add_location(li7, file$3, 46, 16, 1751);
    			add_location(li8, file$3, 49, 16, 1820);
    			attr_dev(ul, "class", "font-readex text-xs mt-5 ml-5 svelte-of1b79");
    			add_location(ul, file$3, 24, 12, 1173);
    			attr_dev(article, "class", "text-justify text-lg");
    			add_location(article, file$3, 9, 8, 337);
    			attr_dev(div1, "class", "image-holder bg-gray-500 flex justify-center items-center svelte-of1b79");
    			add_location(div1, file$3, 55, 12, 2073);
    			attr_dev(div2, "class", "image-container flex justify-center items-center m-9 right-5 sm:right-0 sm:pr-0 bg-gray-500 text-white font-lato font-bold svelte-of1b79");
    			add_location(div2, file$3, 54, 8, 1923);
    			attr_dev(div3, "class", "article-container flex flex-col md:flex-row justify-center items-center svelte-of1b79");
    			add_location(div3, file$3, 8, 4, 242);
    			attr_dev(section, "id", "About");
    			attr_dev(section, "class", "flex flex-col justify-center py-4 svelte-of1b79");
    			add_location(section, file$3, 4, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, h2);
    			append_dev(section, t1);
    			append_dev(section, div3);
    			append_dev(div3, article);
    			append_dev(article, p0);
    			append_dev(article, t3);
    			append_dev(article, p1);
    			append_dev(article, t5);
    			append_dev(article, p2);
    			append_dev(article, t7);
    			append_dev(article, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t9);
    			append_dev(ul, li1);
    			append_dev(ul, t11);
    			append_dev(ul, li2);
    			append_dev(ul, t13);
    			append_dev(ul, li3);
    			append_dev(ul, t15);
    			append_dev(ul, li4);
    			append_dev(ul, t17);
    			append_dev(ul, li5);
    			append_dev(ul, t19);
    			append_dev(ul, li6);
    			append_dev(ul, t21);
    			append_dev(ul, li7);
    			append_dev(ul, t23);
    			append_dev(ul, li8);
    			append_dev(div3, t25);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\Contact.svelte generated by Svelte v3.44.2 */

    const file$2 = "src\\components\\Contact.svelte";

    function create_fragment$2(ctx) {
    	let section;
    	let h1;
    	let t1;
    	let p;
    	let t2;
    	let span;
    	let t4;
    	let t5;
    	let div;
    	let a;
    	let button;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h1 = element("h1");
    			h1.textContent = "Contact Me";
    			t1 = space();
    			p = element("p");
    			t2 = text("If there is anything you would like to bring up\r\n        with me, then I'm all ears. Send an email to\r\n        the address: ");
    			span = element("span");
    			span.textContent = "jdb.prog@gmail.com";
    			t4 = text(" or click the button\r\n        below and I'll try to respond as early as I can.");
    			t5 = space();
    			div = element("div");
    			a = element("a");
    			button = element("button");
    			button.textContent = "> Send me an email...";
    			attr_dev(h1, "class", "mb-8 font-extrabold font-roboto text-6xl");
    			add_location(h1, file$2, 5, 4, 103);
    			attr_dev(span, "class", "font-extrabold hover:text-indigo-500 transition");
    			add_location(span, file$2, 11, 21, 381);
    			attr_dev(p, "class", "text-justify max-w-2xl font-roboto text-xl svelte-1u6sr6r");
    			add_location(p, file$2, 8, 4, 193);
    			attr_dev(button, "class", "mt-12 bg-transparent hover:bg-gray-700 text-gray-700 font-semibold hover:text-white py-2 px-4 border border-gray-700 hover:border-transparent rounded transition");
    			add_location(button, file$2, 16, 12, 643);
    			attr_dev(a, "href", "mailto:jdb.prog@gmail.com");
    			add_location(a, file$2, 15, 8, 593);
    			attr_dev(div, "class", "mx-auto");
    			add_location(div, file$2, 14, 4, 562);
    			attr_dev(section, "id", "Contact");
    			attr_dev(section, "class", "flex flex-col justify-center items-center svelte-1u6sr6r");
    			add_location(section, file$2, 4, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h1);
    			append_dev(section, t1);
    			append_dev(section, p);
    			append_dev(p, t2);
    			append_dev(p, span);
    			append_dev(p, t4);
    			append_dev(section, t5);
    			append_dev(section, div);
    			append_dev(div, a);
    			append_dev(a, button);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Contact', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\IconBar.svelte generated by Svelte v3.44.2 */

    const file$1 = "src\\components\\IconBar.svelte";

    function create_fragment$1(ctx) {
    	let link;
    	let t0;
    	let div4;
    	let div0;
    	let a0;
    	let i0;
    	let t1;
    	let div1;
    	let a1;
    	let i1;
    	let t2;
    	let div2;
    	let a2;
    	let i2;
    	let t3;
    	let div3;
    	let a3;
    	let i3;

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			div4 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			t1 = space();
    			div1 = element("div");
    			a1 = element("a");
    			i1 = element("i");
    			t2 = space();
    			div2 = element("div");
    			a2 = element("a");
    			i2 = element("i");
    			t3 = space();
    			div3 = element("div");
    			a3 = element("a");
    			i3 = element("i");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://use.fontawesome.com/releases/v5.15.4/css/all.css");
    			attr_dev(link, "integrity", "sha384-DyZ88mC6Up2uqS4h/KRgHuoeGwBcD4Ng9SiP4dIRy0EXTlnuz47vAwmeGwVChigm");
    			attr_dev(link, "crossorigin", "anonymous");
    			add_location(link, file$1, 5, 4, 44);
    			attr_dev(i0, "class", "fab fa-github fa-2x text-gray-600 hover:text-indigo-600 transform transition svelte-4mn9xx");
    			add_location(i0, file$1, 11, 12, 432);
    			attr_dev(a0, "href", "https://github.com/JeremiasBulanadi");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$1, 10, 8, 356);
    			attr_dev(div0, "class", "icon svelte-4mn9xx");
    			add_location(div0, file$1, 9, 4, 328);
    			attr_dev(i1, "class", "fab fa-linkedin-in fa-2x text-gray-600 hover:text-indigo-600 transform transition svelte-4mn9xx");
    			add_location(i1, file$1, 16, 12, 681);
    			attr_dev(a1, "href", "https://www.linkedin.com/in/jeremias-bulanadi-25b5a915a/");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$1, 15, 8, 584);
    			attr_dev(div1, "class", "icon svelte-4mn9xx");
    			add_location(div1, file$1, 14, 4, 556);
    			attr_dev(i2, "class", "fab fa-codepen fa-2x text-gray-600 hover:text-indigo-600 transform transition svelte-4mn9xx");
    			add_location(i2, file$1, 21, 12, 914);
    			attr_dev(a2, "href", "https://codepen.io/jeremiasbulanadi");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$1, 20, 8, 838);
    			attr_dev(div2, "class", "icon svelte-4mn9xx");
    			add_location(div2, file$1, 19, 4, 810);
    			attr_dev(i3, "class", "fas fa-at fa-2x text-gray-600 hover:text-indigo-600 transform transition svelte-4mn9xx");
    			add_location(i3, file$1, 26, 12, 1133);
    			attr_dev(a3, "href", "mailto:jdb.prog@gmail.com");
    			attr_dev(a3, "target", "_blank");
    			add_location(a3, file$1, 25, 8, 1067);
    			attr_dev(div3, "class", "icon svelte-4mn9xx");
    			add_location(div3, file$1, 24, 4, 1039);
    			attr_dev(div4, "class", "icon-bar flex lg:flex-col justify-center gap-x-12 svelte-4mn9xx");
    			add_location(div4, file$1, 8, 0, 259);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, a0);
    			append_dev(a0, i0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div1, a1);
    			append_dev(a1, i1);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			append_dev(div2, a2);
    			append_dev(a2, i2);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, a3);
    			append_dev(a3, i3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('IconBar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<IconBar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class IconBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IconBar",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src\App.svelte generated by Svelte v3.44.2 */
    const file = "src\\App.svelte";

    // (18:2) {#if firstLoaded}
    function create_if_block_1(ctx) {
    	let div;
    	let navbar;
    	let div_intro;
    	let current;
    	navbar = new Navbar({ props: { offset: 20 }, $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(navbar.$$.fragment);
    			add_location(div, file, 18, 4, 548);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(navbar, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { delay: 100, duration: 1500 });
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(navbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(18:2) {#if firstLoaded}",
    		ctx
    	});

    	return block;
    }

    // (29:2) {#if firstLoaded}
    function create_if_block(ctx) {
    	let div;
    	let iconbar;
    	let div_intro;
    	let current;
    	iconbar = new IconBar({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(iconbar.$$.fragment);
    			attr_dev(div, "class", "side-bar-container svelte-1qb4a0r");
    			add_location(div, file, 29, 3, 790);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(iconbar, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbar.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { delay: 100, duration: 1500 });
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iconbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(iconbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(29:2) {#if firstLoaded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div1;
    	let t0;
    	let div0;
    	let intro;
    	let t1;
    	let about;
    	let t2;
    	let contact;
    	let t3;
    	let t4;
    	let footer;
    	let p;
    	let t6;
    	let a;
    	let current;
    	let if_block0 = /*firstLoaded*/ ctx[0] && create_if_block_1(ctx);
    	intro = new Intro({ $$inline: true });
    	about = new About({ $$inline: true });
    	contact = new Contact({ $$inline: true });
    	let if_block1 = /*firstLoaded*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div0 = element("div");
    			create_component(intro.$$.fragment);
    			t1 = space();
    			create_component(about.$$.fragment);
    			t2 = space();
    			create_component(contact.$$.fragment);
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			footer = element("footer");
    			p = element("p");
    			p.textContent = "Site made by Jeremias Bulanadi";
    			t6 = space();
    			a = element("a");
    			a.textContent = "github : jdb.dev";
    			attr_dev(div0, "class", "container flex flex-col justify-center items-center svelte-1qb4a0r");
    			add_location(div0, file, 22, 2, 646);
    			add_location(p, file, 35, 3, 1040);
    			attr_dev(a, "id", "GithubLink");
    			attr_dev(a, "href", "https://github.com/JeremiasBulanadi/jdb.dev");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "text-gray-300 text-xs svelte-1qb4a0r");
    			add_location(a, file, 36, 3, 1083);
    			attr_dev(footer, "class", "flex flex-col justify-center items-center pt-4 pb-8 font-lato font-semibold text-gray-400 text-sm text-center");
    			add_location(footer, file, 34, 2, 909);
    			attr_dev(div1, "class", "container wrapper sm:px-1 svelte-1qb4a0r");
    			add_location(div1, file, 16, 1, 482);
    			attr_dev(main, "class", "bg-gray-200 flex justify-center svelte-1qb4a0r");
    			add_location(main, file, 15, 0, 433);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			mount_component(intro, div0, null);
    			append_dev(div0, t1);
    			mount_component(about, div0, null);
    			append_dev(div0, t2);
    			mount_component(contact, div0, null);
    			append_dev(div1, t3);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t4);
    			append_dev(div1, footer);
    			append_dev(footer, p);
    			append_dev(footer, t6);
    			append_dev(footer, a);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*firstLoaded*/ ctx[0]) {
    				if (if_block0) {
    					if (dirty & /*firstLoaded*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*firstLoaded*/ ctx[0]) {
    				if (if_block1) {
    					if (dirty & /*firstLoaded*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, t4);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro$1(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(intro.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(intro.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			destroy_component(intro);
    			destroy_component(about);
    			destroy_component(contact);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let firstLoaded = false;

    	onMount(() => {
    		$$invalidate(0, firstLoaded = true);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Navbar,
    		Intro,
    		About,
    		Contact,
    		IconBar,
    		onMount,
    		fade,
    		firstLoaded
    	});

    	$$self.$inject_state = $$props => {
    		if ('firstLoaded' in $$props) $$invalidate(0, firstLoaded = $$props.firstLoaded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [firstLoaded];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map