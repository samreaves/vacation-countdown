
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
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
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
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
            flush_render_callbacks($$.after_update);
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
            ctx: [],
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
            if (!is_function(callback)) {
                return noop;
            }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
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
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
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

    /* src/App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div14;
    	let h1;
    	let t1;
    	let div12;
    	let div2;
    	let div0;
    	let t2;
    	let t3;
    	let div1;
    	let t5;
    	let div5;
    	let div3;
    	let t6;
    	let t7;
    	let div4;
    	let t9;
    	let div8;
    	let div6;
    	let t10;
    	let t11;
    	let div7;
    	let t13;
    	let div11;
    	let div9;
    	let t14;
    	let t15;
    	let div10;
    	let t17;
    	let div13;
    	let t18;
    	let t19_value = /*targetDate*/ ctx[4].toLocaleDateString() + "";
    	let t19;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div14 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Countdown Timer";
    			t1 = space();
    			div12 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t2 = text(/*days*/ ctx[0]);
    			t3 = space();
    			div1 = element("div");
    			div1.textContent = "Days";
    			t5 = space();
    			div5 = element("div");
    			div3 = element("div");
    			t6 = text(/*hours*/ ctx[1]);
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "Hours";
    			t9 = space();
    			div8 = element("div");
    			div6 = element("div");
    			t10 = text(/*minutes*/ ctx[2]);
    			t11 = space();
    			div7 = element("div");
    			div7.textContent = "Minutes";
    			t13 = space();
    			div11 = element("div");
    			div9 = element("div");
    			t14 = text(/*seconds*/ ctx[3]);
    			t15 = space();
    			div10 = element("div");
    			div10.textContent = "Seconds";
    			t17 = space();
    			div13 = element("div");
    			t18 = text("Target Date: ");
    			t19 = text(t19_value);
    			attr_dev(h1, "class", "svelte-1at4p0z");
    			add_location(h1, file, 54, 2, 1341);
    			attr_dev(div0, "class", "time-value svelte-1at4p0z");
    			add_location(div0, file, 57, 4, 1431);
    			attr_dev(div1, "class", "time-label svelte-1at4p0z");
    			add_location(div1, file, 58, 4, 1472);
    			attr_dev(div2, "class", "time-unit svelte-1at4p0z");
    			add_location(div2, file, 56, 3, 1403);
    			attr_dev(div3, "class", "time-value svelte-1at4p0z");
    			add_location(div3, file, 61, 4, 1548);
    			attr_dev(div4, "class", "time-label svelte-1at4p0z");
    			add_location(div4, file, 62, 4, 1590);
    			attr_dev(div5, "class", "time-unit svelte-1at4p0z");
    			add_location(div5, file, 60, 3, 1520);
    			attr_dev(div6, "class", "time-value svelte-1at4p0z");
    			add_location(div6, file, 65, 4, 1667);
    			attr_dev(div7, "class", "time-label svelte-1at4p0z");
    			add_location(div7, file, 66, 4, 1711);
    			attr_dev(div8, "class", "time-unit svelte-1at4p0z");
    			add_location(div8, file, 64, 3, 1639);
    			attr_dev(div9, "class", "time-value svelte-1at4p0z");
    			add_location(div9, file, 69, 4, 1790);
    			attr_dev(div10, "class", "time-label svelte-1at4p0z");
    			add_location(div10, file, 70, 4, 1834);
    			attr_dev(div11, "class", "time-unit svelte-1at4p0z");
    			add_location(div11, file, 68, 3, 1762);
    			attr_dev(div12, "class", "countdown-display svelte-1at4p0z");
    			add_location(div12, file, 55, 2, 1368);
    			attr_dev(div13, "class", "target-date svelte-1at4p0z");
    			add_location(div13, file, 73, 2, 1893);
    			attr_dev(div14, "class", "countdown-container svelte-1at4p0z");
    			add_location(div14, file, 53, 1, 1305);
    			attr_dev(main, "class", "svelte-1at4p0z");
    			add_location(main, file, 52, 0, 1297);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div14);
    			append_dev(div14, h1);
    			append_dev(div14, t1);
    			append_dev(div14, div12);
    			append_dev(div12, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div12, t5);
    			append_dev(div12, div5);
    			append_dev(div5, div3);
    			append_dev(div3, t6);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div12, t9);
    			append_dev(div12, div8);
    			append_dev(div8, div6);
    			append_dev(div6, t10);
    			append_dev(div8, t11);
    			append_dev(div8, div7);
    			append_dev(div12, t13);
    			append_dev(div12, div11);
    			append_dev(div11, div9);
    			append_dev(div9, t14);
    			append_dev(div11, t15);
    			append_dev(div11, div10);
    			append_dev(div14, t17);
    			append_dev(div14, div13);
    			append_dev(div13, t18);
    			append_dev(div13, t19);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*days*/ 1) set_data_dev(t2, /*days*/ ctx[0]);
    			if (dirty & /*hours*/ 2) set_data_dev(t6, /*hours*/ ctx[1]);
    			if (dirty & /*minutes*/ 4) set_data_dev(t10, /*minutes*/ ctx[2]);
    			if (dirty & /*seconds*/ 8) set_data_dev(t14, /*seconds*/ ctx[3]);
    			if (dirty & /*targetDate*/ 16 && t19_value !== (t19_value = /*targetDate*/ ctx[4].toLocaleDateString() + "")) set_data_dev(t19, t19_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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
    	let days = 0;
    	let hours = 0;
    	let minutes = 0;
    	let seconds = 0;
    	let targetDate = new Date();
    	let interval;

    	// Get target date from environment variable or use default
    	onMount(() => {
    		// Get target date from environment variable placeholder
    		// This will be replaced during Docker build
    		const envTargetDate = 'TARGET_DATE_PLACEHOLDER';

    		$$invalidate(4, targetDate = new Date(envTargetDate));

    		// Validate the date
    		if (isNaN(targetDate.getTime())) {
    			console.warn('Invalid TARGET_DATE, using default date');
    			$$invalidate(4, targetDate = new Date('2025-01-01T00:00:00'));
    		}

    		updateCountdown();
    		interval = setInterval(updateCountdown, 1000);
    	});

    	onDestroy(() => {
    		if (interval) {
    			clearInterval(interval);
    		}
    	});

    	function updateCountdown() {
    		const now = new Date().getTime();
    		const target = targetDate.getTime();
    		const difference = target - now;

    		if (difference > 0) {
    			$$invalidate(0, days = Math.floor(difference / (1000 * 60 * 60 * 24)));
    			$$invalidate(1, hours = Math.floor(difference % (1000 * 60 * 60 * 24) / (1000 * 60 * 60)));
    			$$invalidate(2, minutes = Math.floor(difference % (1000 * 60 * 60) / (1000 * 60)));
    			$$invalidate(3, seconds = Math.floor(difference % (1000 * 60) / 1000));
    		} else {
    			$$invalidate(0, days = 0);
    			$$invalidate(1, hours = 0);
    			$$invalidate(2, minutes = 0);
    			$$invalidate(3, seconds = 0);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		days,
    		hours,
    		minutes,
    		seconds,
    		targetDate,
    		interval,
    		updateCountdown
    	});

    	$$self.$inject_state = $$props => {
    		if ('days' in $$props) $$invalidate(0, days = $$props.days);
    		if ('hours' in $$props) $$invalidate(1, hours = $$props.hours);
    		if ('minutes' in $$props) $$invalidate(2, minutes = $$props.minutes);
    		if ('seconds' in $$props) $$invalidate(3, seconds = $$props.seconds);
    		if ('targetDate' in $$props) $$invalidate(4, targetDate = $$props.targetDate);
    		if ('interval' in $$props) interval = $$props.interval;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [days, hours, minutes, seconds, targetDate];
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
