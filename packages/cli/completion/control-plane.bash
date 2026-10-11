# Bash 4+ completion. Load with: source <(control-plane completion bash)
_control_plane_complete() {
    local LC_ALL=C
    local line="${COMP_LINE:0:COMP_POINT}" char quote='' escaped=0 active=0 i
    local -a words=('') response=()
    local index=0
    for ((i=0; i<${#line}; i++)); do
        char="${line:i:1}"
        if ((escaped)); then
            words[index]+="$char"; escaped=0; active=1; continue
        fi
        if [[ "$quote" == "'" ]]; then
            if [[ "$char" == "'" ]]; then quote=''; else words[index]+="$char"; fi
            active=1; continue
        fi
        if [[ "$char" == '\' ]]; then escaped=1; active=1; continue; fi
        if [[ "$quote" == '"' ]]; then
            if [[ "$char" == '"' ]]; then quote=''; else words[index]+="$char"; fi
            active=1; continue
        fi
        case "$char" in
            "'"|'"') quote="$char"; active=1 ;;
            ' '|$'\t') if ((active)); then ((index+=1)); words[index]=''; active=0; fi ;;
            *) words[index]+="$char"; active=1 ;;
        esac
    done
    COMPREPLY=()
    mapfile -t response < <(control-plane completion candidates --shell bash --index "$index" -- "${words[@]}" 2>/dev/null)
    if [[ "${response[0]-}" == 'directory' ]]; then
        mapfile -t COMPREPLY < <(compgen -d -- "${words[index]}")
        for i in "${!COMPREPLY[@]}"; do COMPREPLY[i]+='/'; done
        compopt -o filenames 2>/dev/null || true
    else
        COMPREPLY=("${response[@]:1}")
    fi
}
complete -F _control_plane_complete control-plane
