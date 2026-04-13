--
-- PostgreSQL database dump
--

\restrict eg5mjqgRcdn8mwB1omLI8ZdBhNGnrXImBxzHL4l7HdNLMhetCpRLygeF0bsYxkk

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Crags; Type: TABLE; Schema: public; Owner: Shadeclimb_user
--

CREATE TABLE public."Crags" (
    id_escuela integer NOT NULL,
    nombre character varying(50) NOT NULL,
    provincia character varying(50) NOT NULL,
    com_autonoma character varying(50) NOT NULL,
    num_vias integer NOT NULL,
    min_grado integer,
    max_grado integer
);


ALTER TABLE public."Crags" OWNER TO postgres;

--
-- Name: Sectors; Type: TABLE; Schema: public; Owner: Shadeclimb_user
--

CREATE TABLE public."Sectors" (
    id_sector integer CONSTRAINT sectors_id_sector_not_null NOT NULL,
    nombre character varying(100) CONSTRAINT sectors_nombre_not_null NOT NULL,
    id_escuela integer CONSTRAINT sectors_id_escuela_not_null NOT NULL,
    min_grado character varying(10),
    max_grado character varying(10),
    num_vias integer
);


ALTER TABLE public."Sectors" OWNER TO postgres;

--
-- Name: sectors_id_sector_seq; Type: SEQUENCE; Schema: public; Owner: Shadeclimb_user
--

CREATE SEQUENCE public.sectors_id_sector_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sectors_id_sector_seq OWNER TO postgres;

--
-- Name: sectors_id_sector_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Shadeclimb_user
--

ALTER SEQUENCE public.sectors_id_sector_seq OWNED BY public."Sectors".id_sector;


--
-- Name: Sectors id_sector; Type: DEFAULT; Schema: public; Owner: Shadeclimb_user
--

ALTER TABLE ONLY public."Sectors" ALTER COLUMN id_sector SET DEFAULT nextval('public.sectors_id_sector_seq'::regclass);


--
-- Data for Name: Crags; Type: TABLE DATA; Schema: public; Owner: Shadeclimb_user
--

COPY public."Crags" (id_escuela, nombre, provincia, com_autonoma, num_vias, min_grado, max_grado) FROM stdin;
2	La pedriza	Madrid	Comunidad de Madrid	800	4	8
1	Cuenca	Cuenca	Castilla la Mancha	1200	4	8
\.


--
-- Data for Name: Sectors; Type: TABLE DATA; Schema: public; Owner: Shadeclimb_user
--

COPY public."Sectors" (id_sector, nombre, id_escuela, min_grado, max_grado, num_vias) FROM stdin;
1	Juego de Bolos	1	6a	8b+	40
\.


--
-- Name: sectors_id_sector_seq; Type: SEQUENCE SET; Schema: public; Owner: Shadeclimb_user
--

SELECT pg_catalog.setval('public.sectors_id_sector_seq', 1, true);


--
-- Name: Crags Crags_pkey; Type: CONSTRAINT; Schema: public; Owner: Shadeclimb_user
--

ALTER TABLE ONLY public."Crags"
    ADD CONSTRAINT "Crags_pkey" PRIMARY KEY (id_escuela);


--
-- Name: Sectors sectors_pkey; Type: CONSTRAINT; Schema: public; Owner: Shadeclimb_user
--

ALTER TABLE ONLY public."Sectors"
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id_sector);


--
-- Name: Sectors fk_crag; Type: FK CONSTRAINT; Schema: public; Owner: Shadeclimb_user
--

ALTER TABLE ONLY public."Sectors"
    ADD CONSTRAINT fk_crag FOREIGN KEY (id_escuela) REFERENCES public."Crags"(id_escuela) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict eg5mjqgRcdn8mwB1omLI8ZdBhNGnrXImBxzHL4l7HdNLMhetCpRLygeF0bsYxkk

