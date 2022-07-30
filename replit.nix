# { pkgs }: {
#	deps = with pkgs; [
#		nodejs-16_x
#	];
# }
{ pkgs }: let
    nixpkgs = builtins.fetchTarball {
        url = "https://github.com/NixOS/nixpkgs/archive/nixos-22.05.tar.gz";
        # sha256 = "18qhrp5jbn51vgc534xlyz1hjjsv5syxh5mshwgkyqh5k3njdzlh";
    };

    pkgs = import nixpkgs {
        config = { 
            allowUnfree = true;
        }; 
    };

in {
    deps = [
        pkgs.nodejs-18_x
    ];
}
